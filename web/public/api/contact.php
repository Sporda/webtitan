<?php
declare(strict_types=1);

/*
 * Formuláře webtitan.cz (poptávka, 15min hovor, bezplatná kontrola, okno při odchodu) → e-mail přes Resend.
 *
 * POST /api/contact.php  (Content-Type: application/json)
 *   {"source":"poptavka|hovor|zavolat|kontrola|exit","name":"…","email":"…","phone":"…","message":"…","website":"","page":"/",
 *    "src":{"source":"…","medium":"…","campaign":"…","click":"sklik","ref":"www.google.com","land":"/…","pages":3}}
 *   „zavolat“ (Zavolejte mi) potřebuje telefon a e-mail je u něj nepovinný; ostatní formuláře potřebují e-mail.
 *   „src“ = odkud návštěvník přišel (nepovinné, z /assets/lead.js) → kanál v e-mailu a v CRM.
 * 200 {"ok":true} | 400 {"error":"input","fields":{…}} | 429 {"error":"rate"} | 502/503 {"error":"mail"}
 *
 * - Každé odeslání se nejdřív uloží do SQLite (data/leads.sqlite) – i když by e-mail selhal, poptávka se neztratí.
 * - E-mail posílá sdílená knihovna _mail.php; nedoručené poptávky znovu zkouší health.php.
 * - Zákazník dostane krátké potvrzení (bez opakování jeho textu, nejvýš 2× za den na jednu adresu).
 * - S CRM_TOKEN v contact.env jde poptávka i do CRM (crm.webtitan.cz → Poptávky), i když e-mail selže.
 * - Konfigurace (klíč k Resendu, adresát) je v /var/www/webtitan/data/contact.env mimo web a mimo git:
 *     RESEND_API_KEY=re_…
 *     MAIL_TO=adresa@kam.pujdou.poptavky
 *     MAIL_FROM=WebTitan <jan@webtitan.cz>
 * - Ochrana: kontrola Origin, jen JSON, skryté pole „website“ proti robotům, limity na IP (IP se ukládá jen jako otisk).
 */

const ALLOWED_ORIGINS = ['https://webtitan.cz', 'https://www.webtitan.cz'];
const LIMIT_10MIN = 5;
const LIMIT_DAY = 20;
const LIMIT_GLOBAL_DAY = 300;

require __DIR__ . '/_mail.php';

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
if (!array_key_exists($source, WT_SOURCES)) {
    $fields['source'] = 'Neznámý formulář.';
}
if (mb_strlen($name) < 2) {
    $fields['name'] = 'Vyplňte prosím jméno.';
}
if ($source === 'zavolat') {
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $fields['email'] = 'Zkontrolujte prosím e-mail.';
    }
    if ($phone === '') {
        $fields['phone'] = 'Vyplňte prosím telefon, ať vám můžu zavolat.';
    }
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $fields['email'] = 'Zkontrolujte prosím e-mail.';
}
if ($phone !== '' && (!preg_match('/^[0-9+()\/.\- ]{6,40}$/', $phone) || preg_match_all('/\d/', $phone) < 9)) {
    $fields['phone'] = 'Zkontrolujte prosím telefon.';
}
if (mb_strlen($message) < 10) {
    $fields['message'] = 'Zpráva je příliš krátká.';
}
if ($fields) {
    out(400, ['error' => 'input', 'fields' => $fields]);
}

// --- storage ---
if (!is_dir(WT_DATA_DIR) || !is_writable(WT_DATA_DIR)) {
    error_log('contact: data dir missing or not writable');
    out(503, ['error' => 'mail']);
}
$secretFile = WT_DATA_DIR . '/secret.key';
if (!is_file($secretFile)) {
    file_put_contents($secretFile, bin2hex(random_bytes(32)), LOCK_EX);
    @chmod($secretFile, 0600);
}
$ipHash = hash_hmac('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? ''), trim((string) file_get_contents($secretFile)));

try {
    $db = wt_leads_db();

    $now = time();
    // 10 min i 24 h z jednoho průchodu indexem (ip, created); celkový denní počet přes index (created)
    $q = $db->prepare('SELECT SUM(CASE WHEN created > ? THEN 1 ELSE 0 END), COUNT(*) FROM leads WHERE ip = ? AND created > ?');
    $q->execute([$now - 600, $ipHash, $now - 86400]);
    [$n10, $nDay] = array_map('intval', $q->fetch(PDO::FETCH_NUM));
    $q->closeCursor(); // ukončí čtení, ať INSERT níž nenarazí na starý snímek WAL
    $nAll = (int) $db->query('SELECT COUNT(*) FROM leads WHERE created > ' . ($now - 86400))->fetchColumn();
    if ($n10 >= LIMIT_10MIN || $nDay >= LIMIT_DAY || $nAll >= LIMIT_GLOBAL_DAY) {
        out(429, ['error' => 'rate']);
    }

    $spam = $honeypot !== '' ? 1 : 0;
    $attr = wt_attribution($in['src'] ?? null);
    $channel = $attr ? wt_channel($attr) : '';
    $attrJson = $attr ? (string) json_encode($attr, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : '';
    $db->prepare('INSERT INTO leads (created, source, name, email, phone, message, page, ip, ua, spam, status, channel, attribution)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
       ->execute([$now, $source, $name, $email, $phone, $message, $page, $ipHash,
                  clean((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 300), $spam, $spam ? 'spam' : 'new', $channel, $attrJson]);
    $leadId = (int) $db->lastInsertId();
} catch (Throwable $e) {
    error_log('contact db: ' . $e->getMessage());
    out(503, ['error' => 'mail']);
}

// Robot vyplnil skryté pole – tváříme se, že je vše v pořádku, ale e-mail neposíláme.
if ($spam) {
    out(200, ['ok' => true]);
}

// --- e-mail pro mě (sdílená knihovna _mail.php – stejný kód používá health.php pro opakované doručení) ---
$cfg = wt_config();
$lead = [
    'id' => $leadId, 'created' => $now, 'source' => $source, 'name' => $name, 'email' => $email,
    'phone' => $phone, 'message' => $message, 'page' => $page, 'channel' => $channel, 'attribution' => $attrJson,
];
[$ok, $info] = wt_send_lead($lead, $cfg);
$crm = wt_crm_enabled($cfg);
try {
    // crm = pending: kdyby se odeslání do CRM níž nestihlo, health.php ho dokončí.
    $db->prepare('UPDATE leads SET status = ?, info = ?, attempts = 1, last_try = ?, crm = ? WHERE id = ?')
       ->execute([$ok ? 'sent' : 'failed', mb_substr($info, 0, 500), $now, $crm ? 'pending' : '', $leadId]);
} catch (Throwable $e) {
    error_log('contact mark: ' . $e->getMessage());
}
if (!$ok) {
    // Zákazník uvidí chybu s odkazem na e-mail; poptávka zůstává v DB (a v CRM) a health.php zkusí e-mail znovu.
    error_log('contact mail failed: ' . $info);
}

// Potvrzení zákazníkovi jen když poptávka opravdu odešla (jinak formulář ukazuje chybu).
$confirm = false;
if ($ok) {
    try {
        $confirm = wt_confirm_allowed($db, $cfg, $email, $now);
    } catch (Throwable $e) {
        error_log('contact confirm check: ' . $e->getMessage());
    }
}

// --- odpověď prohlížeči; potvrzení a CRM až potom, aby formulář nečekal ---
http_response_code($ok ? 200 : 502);
echo json_encode($ok ? ['ok' => true] : ['error' => 'mail']);
if (!$confirm && !$crm) {
    exit;
}
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

if ($confirm) {
    [$cok, $cinfo] = wt_send_confirmation($lead, $cfg);
    try {
        $db->prepare('UPDATE leads SET confirm = ? WHERE id = ?')->execute([$cok ? 'sent' : 'failed', $leadId]);
    } catch (Throwable $e) {
        error_log('contact confirm mark: ' . $e->getMessage());
    }
    if (!$cok) {
        error_log('contact confirm failed: ' . $cinfo);
    }
}

// --- do CRM (crm.webtitan.cz → Poptávky); při chybě to health.php zkusí znovu ---
if ($crm) {
    [$pok, $pinfo] = wt_push_crm($lead, $cfg);
    try {
        $db->prepare('UPDATE leads SET crm = ? WHERE id = ?')->execute([$pok ? 'sent' : 'failed', $leadId]);
    } catch (Throwable $e) {
        error_log('contact crm mark: ' . $e->getMessage());
    }
    if (!$pok) {
        error_log('contact crm failed: ' . $pinfo);
    }
}
