<?php
declare(strict_types=1);

/*
 * Příjem e-mailů pro *@webtitan.cz přes Resend Receiving → přeposlání do MAIL_TO (např. Gmail).
 *
 * Resend po přijetí e-mailu zavolá tento webhook (událost "email.received", podepsaná Svixem).
 * Skript ověří podpis, stáhne obsah e-mailu přes API (GET /emails/receiving/{id}) a pošle ho dál
 * přes POST /emails. Odpovědět jde rovnou z Gmailu – Reply-To míří na původního odesílatele.
 *
 * Konfigurace v /var/www/webtitan/data/contact.env (mimo web i git):
 *   RESEND_API_KEY=re_…            – odesílání (stačí klíč „Sending access“)
 *   RESEND_FULL_API_KEY=re_…       – čtení přijatých e-mailů (klíč „Full access“)
 *   RESEND_WEBHOOK_SECRET=whsec_…  – podpisový klíč webhooku z Resendu
 *   MAIL_TO=…                      – kam přeposílat
 *
 * Každý přijatý e-mail se zapíše do data/inbound.sqlite; opakované doručení téhož webhooku se nepřepošle dvakrát.
 */

const DATA_DIR = '/var/www/webtitan/data';
const TOLERANCE = 300;            // max. stáří podpisu v sekundách
const MAX_ATTACH_BYTES = 30000000; // větší přílohy se nepřepošlou, jen se zmíní

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

function out(int $code, array $body): never
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function load_config(): array
{
    $cfg = [];
    $file = DATA_DIR . '/contact.env';
    if (is_readable($file)) {
        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
                continue;
            }
            [$k, $v] = explode('=', $line, 2);
            $cfg[trim($k)] = trim(trim($v), "\"'");
        }
    }
    return $cfg;
}

function resend(string $method, string $path, string $key, ?array $body = null): array
{
    $ch = curl_init('https://api.resend.com' . $path);
    $opts = [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json',
            'User-Agent: webtitan-inbound/1.0',
        ],
    ];
    if ($body !== null) {
        $opts[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE);
    }
    curl_setopt_array($ch, $opts);
    $resp = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return [$code, $resp === false ? null : json_decode((string) $resp, true), $err !== '' ? $err : mb_substr((string) $resp, 0, 300)];
}

/** Vytáhne e-mailovou adresu z „Jméno <adresa>“ nebo vrátí vstup. */
function addr(string $s): string
{
    return preg_match('/<([^>]+)>/', $s, $m) ? trim($m[1]) : trim($s);
}

/** Vytáhne zobrazované jméno z „Jméno <adresa>“. */
function display_name(string $s): string
{
    $name = preg_match('/^\s*"?([^"<]*?)"?\s*</', $s, $m) ? trim($m[1]) : '';
    return $name !== '' ? $name : addr($s);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    out(405, ['error' => 'method']);
}

$cfg = load_config();
$secret = $cfg['RESEND_WEBHOOK_SECRET'] ?? '';
$readKey = $cfg['RESEND_FULL_API_KEY'] ?? '';
$sendKey = $cfg['RESEND_API_KEY'] ?? $readKey;
$to = $cfg['MAIL_TO'] ?? '';
$from = $cfg['MAIL_FROM'] ?? 'WebTitan <kontakt@webtitan.cz>';
if ($secret === '') {
    out(503, ['error' => 'not configured']);
}

// --- ověření podpisu (Svix: HMAC-SHA256 nad "id.timestamp.body", klíč = base64 část za whsec_) ---
$raw = (string) file_get_contents('php://input', false, null, 0, 2000000);
$msgId = (string) ($_SERVER['HTTP_SVIX_ID'] ?? $_SERVER['HTTP_WEBHOOK_ID'] ?? '');
$ts = (string) ($_SERVER['HTTP_SVIX_TIMESTAMP'] ?? $_SERVER['HTTP_WEBHOOK_TIMESTAMP'] ?? '');
$sigHeader = (string) ($_SERVER['HTTP_SVIX_SIGNATURE'] ?? $_SERVER['HTTP_WEBHOOK_SIGNATURE'] ?? '');
if ($msgId === '' || !ctype_digit($ts) || abs(time() - (int) $ts) > TOLERANCE || $sigHeader === '') {
    out(401, ['error' => 'signature']);
}
$keyBytes = base64_decode(preg_replace('/^whsec_/', '', $secret), true);
$expected = base64_encode(hash_hmac('sha256', $msgId . '.' . $ts . '.' . $raw, (string) $keyBytes, true));
$valid = false;
foreach (preg_split('/\s+/', trim($sigHeader)) as $part) {
    [$ver, $sig] = array_pad(explode(',', $part, 2), 2, '');
    if ($ver === 'v1' && hash_equals($expected, $sig)) {
        $valid = true;
        break;
    }
}
if (!$valid) {
    out(401, ['error' => 'signature']);
}

$event = json_decode($raw, true);
if (!is_array($event) || ($event['type'] ?? '') !== 'email.received') {
    out(200, ['ok' => true, 'ignored' => (string) ($event['type'] ?? '')]);
}
$emailId = (string) ($event['data']['email_id'] ?? '');
if (!preg_match('/^[A-Za-z0-9_-]{8,80}$/', $emailId)) {
    out(400, ['error' => 'email_id']);
}
if ($readKey === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    out(503, ['error' => 'not configured']);
}
if (str_ends_with(strtolower($to), '@webtitan.cz')) {
    out(500, ['error' => 'MAIL_TO must not be @webtitan.cz (forwarding loop)']);
}

// --- deduplikace a záznam ---
try {
    $db = new PDO('sqlite:' . DATA_DIR . '/inbound.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout = 3000');
    $db->exec('CREATE TABLE IF NOT EXISTS inbound (
        email_id TEXT PRIMARY KEY, created INTEGER NOT NULL, mail_from TEXT NOT NULL DEFAULT \'\',
        mail_to TEXT NOT NULL DEFAULT \'\', subject TEXT NOT NULL DEFAULT \'\', status TEXT NOT NULL, info TEXT NOT NULL DEFAULT \'\'
    )');
    $q = $db->prepare('SELECT status FROM inbound WHERE email_id = ?');
    $q->execute([$emailId]);
    if ($q->fetchColumn() === 'forwarded') {
        out(200, ['ok' => true, 'duplicate' => true]);
    }
    $db->prepare('INSERT OR IGNORE INTO inbound (email_id, created, status) VALUES (?, ?, \'received\')')->execute([$emailId, time()]);
} catch (Throwable $e) {
    error_log('inbound db: ' . $e->getMessage());
    out(500, ['error' => 'storage']);
}
$mark = static function (string $status, string $info, array $meta = []) use ($db, $emailId): void {
    $db->prepare('UPDATE inbound SET status = ?, info = ?, mail_from = COALESCE(?, mail_from), mail_to = COALESCE(?, mail_to),
                  subject = COALESCE(?, subject) WHERE email_id = ?')
       ->execute([$status, mb_substr($info, 0, 500), $meta['from'] ?? null, $meta['to'] ?? null, $meta['subject'] ?? null, $emailId]);
};

// --- stažení e-mailu ---
[$code, $mail, $info] = resend('GET', '/emails/receiving/' . rawurlencode($emailId), $readKey);
if ($code !== 200 || !is_array($mail)) {
    $mark('failed', 'get ' . $code . ': ' . $info);
    out(502, ['error' => 'fetch']); // Resend webhook to zkusí znovu
}
$origFrom = (string) ($mail['from'] ?? '');
$origTo = implode(', ', array_map('strval', (array) ($mail['to'] ?? [])));
$subject = (string) ($mail['subject'] ?? '(bez předmětu)');
$replyTo = addr((string) (((array) ($mail['reply_to'] ?? []))[0] ?? $origFrom));
$meta = ['from' => $origFrom, 'to' => $origTo, 'subject' => $subject];

// --- přílohy (přeposílají se odkazem, Resend si je stáhne sám) ---
$attachments = [];
$skipped = [];
if (!empty($mail['attachments'])) {
    [$ac, $alist] = resend('GET', '/emails/receiving/' . rawurlencode($emailId) . '/attachments', $readKey);
    $total = 0;
    foreach ((array) ($alist['data'] ?? []) as $a) {
        $size = (int) ($a['size'] ?? 0);
        $url = (string) ($a['download_url'] ?? '');
        $name = (string) ($a['filename'] ?? 'priloha');
        if ($url === '' || $total + $size > MAX_ATTACH_BYTES) {
            $skipped[] = $name;
            continue;
        }
        $total += $size;
        $att = ['filename' => $name, 'path' => $url];
        if (!empty($a['content_type'])) {
            $att['content_type'] = (string) $a['content_type'];
        }
        $attachments[] = $att;
    }
}

// --- přeposlání ---
$h = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$note = 'Přijato na ' . $origTo . ' · od ' . $origFrom . ($skipped ? ' · nepřeposlané přílohy: ' . implode(', ', $skipped) : '');
$banner = '<div style="font:13px Arial,sans-serif;color:#565779;background:#f7f5fb;border:1px solid #d3cee3;border-radius:8px;'
        . 'padding:8px 12px;margin:0 0 14px">' . $h($note) . '</div>';
$html = (string) ($mail['html'] ?? '');
$text = (string) ($mail['text'] ?? '');
$sendBody = [
    'from'     => '"' . str_replace(['"', "\r", "\n"], '', mb_substr(display_name($origFrom), 0, 60)) . ' přes webtitan.cz" <' . addr($from) . '>',
    'to'       => [$to],
    'reply_to' => filter_var($replyTo, FILTER_VALIDATE_EMAIL) ? $replyTo : addr($from),
    'subject'  => mb_substr(str_replace(["\r", "\n"], ' ', $subject), 0, 250),
    'html'     => $banner . ($html !== '' ? $html : '<pre style="white-space:pre-wrap;font:14px Arial,sans-serif">' . $h($text) . '</pre>'),
    'text'     => $note . "\n\n" . ($text !== '' ? $text : trim(strip_tags($html))),
];
if ($attachments) {
    $sendBody['attachments'] = $attachments;
}
[$sc, $sent, $sinfo] = resend('POST', '/emails', $sendKey, $sendBody);
if ($sc >= 200 && $sc < 300) {
    $mark('forwarded', (string) ($sent['id'] ?? ''), $meta);
    out(200, ['ok' => true]);
}
$mark('failed', 'send ' . $sc . ': ' . $sinfo, $meta);
error_log('inbound forward failed: send ' . $sc . ': ' . $sinfo);
out(502, ['error' => 'forward']);
