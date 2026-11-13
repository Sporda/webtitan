<?php
declare(strict_types=1);

/*
 * Lajky návrhů pro /designs.html
 *
 * Pravidla:
 *  - jeden návštěvník = nejvýš jeden lajk na jeden návrh (může lajknout více návrhů, lajk může i vzít zpět),
 *  - návštěvníka pozná podle náhodného ID v HttpOnly cookie (bez přihlášení, bez fingerprintingu),
 *  - pojistka proti mazání cookies: z jedné IP adresy může jeden návrh lajknout nejvýš IP_CAP různých návštěvníků,
 *  - IP adresy se neukládají, jen jejich HMAC otisk s tajným klíčem.
 *
 * GET  /api/likes.php                      -> {"counts":{"8":3,...},"mine":[8,11]}
 * POST /api/likes.php {"design":8,"liked":true|false} (Content-Type: application/json) -> stejná odpověď
 */

const DESIGNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const DATA_DIR = '/var/www/webtitan/data';
const COOKIE = 'wt_voter';
const IP_CAP = 3;
const RATE_MAX = 60;
const ALLOWED_ORIGINS = ['https://webtitan.cz', 'https://www.webtitan.cz'];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');

function out(int $code, array $body): never
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    out(405, ['error' => 'method']);
}

if (!is_dir(DATA_DIR) || !is_writable(DATA_DIR)) {
    error_log('likes: data dir missing or not writable');
    out(500, ['error' => 'storage']);
}

$secretFile = DATA_DIR . '/secret.key';
if (!is_file($secretFile)) {
    file_put_contents($secretFile, bin2hex(random_bytes(32)), LOCK_EX);
    @chmod($secretFile, 0600);
}
$secret = trim((string) file_get_contents($secretFile));

try {
    $db = new PDO('sqlite:' . DATA_DIR . '/likes.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout = 3000');
    $db->exec('PRAGMA journal_mode = WAL');
    $db->exec('CREATE TABLE IF NOT EXISTS likes (
        design  INTEGER NOT NULL,
        voter   TEXT    NOT NULL,
        ip      TEXT    NOT NULL,
        created INTEGER NOT NULL,
        PRIMARY KEY (design, voter)
    )');
    $db->exec('CREATE INDEX IF NOT EXISTS likes_design_ip ON likes (design, ip)');
    $db->exec('CREATE TABLE IF NOT EXISTS hits (ip TEXT NOT NULL, minute INTEGER NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (ip, minute))');
} catch (Throwable $e) {
    error_log('likes db: ' . $e->getMessage());
    out(500, ['error' => 'storage']);
}

$ipHash = hash_hmac('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? ''), $secret);

// --- rate limit (per IP, per minute) ---
$minute = intdiv(time(), 60);
$db->prepare('INSERT INTO hits (ip, minute, n) VALUES (?, ?, 1) ON CONFLICT (ip, minute) DO UPDATE SET n = n + 1')
   ->execute([$ipHash, $minute]);
$st = $db->prepare('SELECT n FROM hits WHERE ip = ? AND minute = ?');
$st->execute([$ipHash, $minute]);
if ((int) $st->fetchColumn() > RATE_MAX) {
    out(429, ['error' => 'rate']);
}
if (random_int(1, 50) === 1) {
    $db->prepare('DELETE FROM hits WHERE minute < ?')->execute([$minute - 10]);
}

// --- voter id (HttpOnly cookie) ---
$voter = $_COOKIE[COOKIE] ?? '';
if (!is_string($voter) || !preg_match('/^[a-f0-9]{32}$/', $voter)) {
    $voter = bin2hex(random_bytes(16));
    setcookie(COOKIE, $voter, [
        'expires'  => time() + 60 * 60 * 24 * 730,
        'path'     => '/',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function state(PDO $db, string $voter): array
{
    $counts = [];
    foreach (DESIGNS as $d) {
        $counts[(string) $d] = 0;
    }
    foreach ($db->query('SELECT design, COUNT(*) AS n FROM likes GROUP BY design') as $row) {
        $counts[(string) $row['design']] = (int) $row['n'];
    }
    $st = $db->prepare('SELECT design FROM likes WHERE voter = ? ORDER BY design');
    $st->execute([$voter]);
    $mine = array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN));
    return ['counts' => $counts, 'mine' => $mine];
}

if ($method === 'GET') {
    out(200, state($db, $voter));
}

// --- POST: like / unlike ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, ALLOWED_ORIGINS, true)) {
    out(403, ['error' => 'origin']);
}
if (stripos((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== 0) {
    out(415, ['error' => 'content-type']);
}
$in = json_decode((string) file_get_contents('php://input'), true);
$design = is_array($in) ? ($in['design'] ?? null) : null;
$liked = is_array($in) ? ($in['liked'] ?? null) : null;
if (!is_int($design) || !in_array($design, DESIGNS, true) || !is_bool($liked)) {
    out(400, ['error' => 'input']);
}

try {
    $db->beginTransaction();
    if ($liked) {
        $st = $db->prepare('SELECT 1 FROM likes WHERE design = ? AND voter = ?');
        $st->execute([$design, $voter]);
        if (!$st->fetchColumn()) {
            $st = $db->prepare('SELECT COUNT(*) FROM likes WHERE design = ? AND ip = ?');
            $st->execute([$design, $ipHash]);
            if ((int) $st->fetchColumn() >= IP_CAP) {
                $db->rollBack();
                out(429, ['error' => 'ip_cap'] + state($db, $voter));
            }
            $db->prepare('INSERT INTO likes (design, voter, ip, created) VALUES (?, ?, ?, ?)')
               ->execute([$design, $voter, $ipHash, time()]);
        }
    } else {
        $db->prepare('DELETE FROM likes WHERE design = ? AND voter = ?')->execute([$design, $voter]);
    }
    $db->commit();
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('likes write: ' . $e->getMessage());
    out(500, ['error' => 'storage']);
}

out(200, state($db, $voter));
