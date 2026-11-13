<?php
declare(strict_types=1);

/*
 * Formuláře webtitan.cz (poptávka, 15min hovor, bezplatná kontrola, okno při odchodu) → e-mail přes Resend.
 *
 * POST /api/contact.php  (Content-Type: application/json)
 *   {"source":"poptavka|hovor|kontrola|exit","name":"…","email":"…","phone":"…","message":"…","website":"","page":"/"}
 * 200 {"ok":true} | 400 {"error":"input","fields":{…}} | 429 {"error":"rate"} | 502/503 {"error":"mail"}
 *
 * - Každé odeslání se nejdřív uloží do SQLite (data/leads.sqlite) – i když by e-mail selhal, poptávka se neztratí.
 * - Konfigurace (klíč k Resendu, adresát) je v /var/www/webtitan/data/contact.env mimo web a mimo git:
 *     RESEND_API_KEY=re_…
 *     MAIL_TO=adresa@kam.pujdou.poptavky
 *     MAIL_FROM=WebTitan <kontakt@webtitan.cz>
 * - Ochrana: kontrola Origin, jen JSON, skryté pole „website“ proti robotům, limity na IP (IP se ukládá jen jako otisk).
 */

const DATA_DIR = '/var/www/webtitan/data';
const ALLOWED_ORIGINS = ['https://webtitan.cz', 'https://www.webtitan.cz'];
const SOURCES = [
    'poptavka' => 'Nová poptávka',
    'hovor'    => 'Žádost o 15min hovor',
    'kontrola' => 'Bezplatná kontrola / posouzení',
    'exit'     => 'Bezplatná kontrola (okno při odchodu)',
];
const LIMIT_10MIN = 5;
const LIMIT_DAY = 20;
const LIMIT_GLOBAL_DAY = 300;

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

function clean(string $s, int $max, bool $multiline = false): string
{
    $s = str_replace("\r\n", "\n", $s);
    $s = $multiline
        ? preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s)
        : preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s);
    $s = trim((string) $s);
    return mb_substr($s, 0, $max);
}

function load_config(): array
{
    $cfg = [];
    $file = DATA_DIR . '/contact.env';
    if (!is_readable($file)) {
        return $cfg;
    }
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$k, $v] = explode('=', $line, 2);
        $cfg[trim($k)] = trim(trim($v), "\"'");
    }
    return $cfg;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    out(405, ['error' => 'method']);
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, ALLOWED_ORIGINS, true)) {
    out(403, ['error' => 'origin']);
}
if (stripos((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== 0) {
    out(415, ['error' => 'content-type']);
}
$raw = (string) file_get_contents('php://input', false, null, 0, 65536);
$in = json_decode($raw, true);
if (!is_array($in)) {
    out(400, ['error' => 'input', 'fields' => ['_' => 'Neplatná data.']]);
}

// --- validation ---
$source = is_string($in['source'] ?? null) ? $in['source'] : 'poptavka';
$name = clean((string) ($in['name'] ?? ''), 100);
$email = clean((string) ($in['email'] ?? ''), 254);
$phone = clean((string) ($in['phone'] ?? ''), 40);
$message = clean((string) ($in['message'] ?? ''), 5000, true);
$page = clean((string) ($in['page'] ?? ''), 200);
$honeypot = trim((string) ($in['website'] ?? ''));

$fields = [];
if (!array_key_exists($source, SOURCES)) {
    $fields['source'] = 'Neznámý formulář.';
}
if (mb_strlen($name) < 2) {
    $fields['name'] = 'Vyplňte prosím jméno.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $fields['email'] = 'Zkontrolujte prosím e-mail.';
}
if ($phone !== '' && !preg_match('/^[0-9+()\/.\- ]{6,40}$/', $phone)) {
    $fields['phone'] = 'Zkontrolujte prosím telefon.';
}
if (mb_strlen($message) < 10) {
    $fields['message'] = 'Zpráva je příliš krátká.';
}
if ($fields) {
    out(400, ['error' => 'input', 'fields' => $fields]);
}

// --- storage ---
if (!is_dir(DATA_DIR) || !is_writable(DATA_DIR)) {
    error_log('contact: data dir missing or not writable');
    out(503, ['error' => 'mail']);
}
$secretFile = DATA_DIR . '/secret.key';
if (!is_file($secretFile)) {
    file_put_contents($secretFile, bin2hex(random_bytes(32)), LOCK_EX);
    @chmod($secretFile, 0600);
}
$ipHash = hash_hmac('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? ''), trim((string) file_get_contents($secretFile)));

try {
    $db = new PDO('sqlite:' . DATA_DIR . '/leads.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout = 3000');
    $db->exec('PRAGMA journal_mode = WAL');
    $db->exec('CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created INTEGER NOT NULL,
        source TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
        message TEXT NOT NULL, page TEXT NOT NULL, ip TEXT NOT NULL, ua TEXT NOT NULL,
        spam INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT \'new\', info TEXT NOT NULL DEFAULT \'\'
    )');
    $db->exec('CREATE INDEX IF NOT EXISTS leads_ip_created ON leads (ip, created)');

    $now = time();
    $q = $db->prepare('SELECT COUNT(*) FROM leads WHERE ip = ? AND created > ?');
    $q->execute([$ipHash, $now - 600]);
    $n10 = (int) $q->fetchColumn();
    $q->execute([$ipHash, $now - 86400]);
    $nDay = (int) $q->fetchColumn();
    $nAll = (int) $db->query('SELECT COUNT(*) FROM leads WHERE created > ' . ($now - 86400))->fetchColumn();
    if ($n10 >= LIMIT_10MIN || $nDay >= LIMIT_DAY || $nAll >= LIMIT_GLOBAL_DAY) {
        out(429, ['error' => 'rate']);
    }

    $spam = $honeypot !== '' ? 1 : 0;
    $db->prepare('INSERT INTO leads (created, source, name, email, phone, message, page, ip, ua, spam, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
       ->execute([$now, $source, $name, $email, $phone, $message, $page, $ipHash,
                  clean((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 300), $spam, $spam ? 'spam' : 'new']);
    $leadId = (int) $db->lastInsertId();
} catch (Throwable $e) {
    error_log('contact db: ' . $e->getMessage());
    out(503, ['error' => 'mail']);
}

// Robot vyplnil skryté pole – tváříme se, že je vše v pořádku, ale e-mail neposíláme.
if ($spam) {
    out(200, ['ok' => true]);
}

// --- e-mail ---
$cfg = load_config();
$key = $cfg['RESEND_API_KEY'] ?? '';
$to = $cfg['MAIL_TO'] ?? '';
$from = $cfg['MAIL_FROM'] ?? 'WebTitan <kontakt@webtitan.cz>';

function mark(PDO $db, int $id, string $status, string $info): void
{
    try {
        $db->prepare('UPDATE leads SET status = ?, info = ? WHERE id = ?')->execute([$status, mb_substr($info, 0, 500), $id]);
    } catch (Throwable $e) {
        error_log('contact mark: ' . $e->getMessage());
    }
}

if ($key === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    mark($db, $leadId, 'failed', 'not configured');
    error_log('contact: mail not configured');
    out(503, ['error' => 'mail']);
}

$label = SOURCES[$source];
$type = preg_match('/^Typ:\s*(.+)$/mu', $message, $m) ? clean($m[1], 60) : '';
$subject = $label . ($type !== '' ? ' – ' . $type : '') . ' – ' . $name;
$when = (new DateTimeImmutable('now', new DateTimeZone('Europe/Prague')))->format('j. n. Y H:i');

$h = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$rows = [
    ['Formulář', $h($label)],
    ['Jméno', $h($name)],
    ['E-mail', '<a href="mailto:' . $h($email) . '">' . $h($email) . '</a>'],
];
if ($phone !== '') {
    $rows[] = ['Telefon', '<a href="tel:' . $h(preg_replace('/[^0-9+]/', '', $phone)) . '">' . $h($phone) . '</a>'];
}
$rows[] = ['Odesláno', $h($when) . ' · ' . $h($page !== '' ? $page : '/')];
$tr = '';
foreach ($rows as [$k, $v]) {
    $tr .= '<tr><td style="padding:6px 14px 6px 0;color:#565779;white-space:nowrap;vertical-align:top">' . $k
         . '</td><td style="padding:6px 0;color:#26285a;font-weight:600">' . $v . '</td></tr>';
}
$html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#26285a">'
      . '<div style="height:6px;background:#ff8a1c;border-radius:6px 6px 0 0"></div>'
      . '<div style="background:#f7f5fb;border:1px solid #d3cee3;border-top:0;border-radius:0 0 12px 12px;padding:22px 24px">'
      . '<h2 style="margin:0 0 14px;font-size:20px;color:#2d2f66">' . $h($label) . '</h2>'
      . '<table style="border-collapse:collapse;font-size:15px">' . $tr . '</table>'
      . '<div style="margin-top:18px;padding:16px 18px;background:#ffffff;border:1px solid #d3cee3;border-radius:10px;'
      . 'white-space:pre-wrap;font-size:15px;line-height:1.55">' . $h($message) . '</div>'
      . '<p style="margin:16px 0 0;font-size:13px;color:#565779">Odpovězte přímo na tento e-mail – odpověď půjde zákazníkovi ('
      . $h($email) . ').</p></div></div>';
$text = $label . "\n\nJméno: $name\nE-mail: $email\n" . ($phone !== '' ? "Telefon: $phone\n" : '')
      . "Odesláno: $when · " . ($page !== '' ? $page : '/') . "\n\n$message\n\n"
      . "Odpovězte přímo na tento e-mail – odpověď půjde zákazníkovi.\n";

$payload = json_encode([
    'from'     => $from,
    'to'       => [$to],
    'reply_to' => $email,
    'subject'  => $subject,
    'html'     => $html,
    'text'     => $text,
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 6,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $key,
        'Content-Type: application/json',
        'User-Agent: webtitan-contact/1.0',
    ],
]);
$resp = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($resp !== false && $code >= 200 && $code < 300) {
    $id = (string) (json_decode((string) $resp, true)['id'] ?? '');
    mark($db, $leadId, 'sent', $id);
    out(200, ['ok' => true]);
}

$info = $err !== '' ? 'curl: ' . $err : 'resend ' . $code . ': ' . mb_substr((string) $resp, 0, 300);
mark($db, $leadId, 'failed', $info);
error_log('contact mail failed: ' . $info);
out(502, ['error' => 'mail']);
