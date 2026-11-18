<?php
declare(strict_types=1);

/*
 * Kontrola pro hlídání dostupnosti (UptimeRobot apod.): GET /api/health.php → „OK“ (200), nebo „FAIL …“ (503).
 *
 * Při každém zavolání zároveň znovu zkusí doručit poptávky, které se napoprvé nepodařilo poslat e-mailem
 * (nejvýš 3 najednou; první hodinu každé 4 min, pak jednou za hodinu, nejdéle 3 dny).
 * Poptávku, kterou zákazník mezitím úspěšně poslal znovu (stejný e-mail, novější záznam), už neposílá.
 *
 * FAIL znamená:
 *   config     – chybí klíč k Resendu nebo adresát (data/contact.env)
 *   leads:N    – N poptávek za poslední 3 dny se stále nepodařilo doručit
 *   crm:N      – N poptávek se nepodařilo poslat do CRM (crm.webtitan.cz); zkouší se znovu při každém volání
 *   inbound:N  – N e-mailů na @webtitan.cz se ani po 30 min nepodařilo přeposlat (Resend to sám zkouší dál)
 *   db         – databázi nejde otevřít
 * Výstup neobsahuje žádné osobní údaje, jen počty.
 */

require __DIR__ . '/_mail.php';

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');

const RETRY_BATCH = 3;
const CRM_BATCH = 2;
const RETRY_DAYS = 3;

$now = time();
$cfg = wt_config();
$problems = [];
$configured = ($cfg['RESEND_API_KEY'] ?? '') !== '' && filter_var((string) ($cfg['MAIL_TO'] ?? ''), FILTER_VALIDATE_EMAIL);
if (!$configured) {
    $problems[] = 'config';
}

// --- poptávky: opakované doručení a počet nedoručených ---
if (is_file(WT_DATA_DIR . '/leads.sqlite')) {
    try {
        $db = wt_leads_db();
        $since = $now - RETRY_DAYS * 86400;

        // Zákazník po chybě poslal formulář znovu a to už prošlo → starou poptávku neposílat dvakrát.
        // (Jen podle e-mailu – „Zavolejte mi“ ho mít nemusí a prázdné adresy spolu nesouvisí.)
        $db->prepare('UPDATE leads SET status = \'superseded\' WHERE status = \'failed\' AND spam = 0 AND leads.email <> \'\' AND EXISTS (
                          SELECT 1 FROM leads AS l2 WHERE lower(l2.email) = lower(leads.email)
                          AND l2.id > leads.id AND l2.status = \'sent\')')
           ->execute();

        if ($configured) {
            $q = $db->prepare('SELECT * FROM leads WHERE status = \'failed\' AND spam = 0 AND created > ?
                               AND last_try < ? - CASE WHEN attempts < 15 THEN 240 ELSE 3600 END
                               ORDER BY id LIMIT ' . RETRY_BATCH);
            $q->execute([$since, $now]);
            $mark = $db->prepare('UPDATE leads SET status = ?, info = ?, attempts = attempts + 1, last_try = ? WHERE id = ?');
            foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $lead) {
                [$ok, $info] = wt_send_lead($lead, $cfg, true);
                $mark->execute([$ok ? 'sent' : 'failed', mb_substr(($ok ? 'retry ' : '') . $info, 0, 500), $now, $lead['id']]);
                if (!$ok) {
                    error_log('health: lead ' . $lead['id'] . ' retry failed: ' . $info);
                }
            }
        }

        $q = $db->prepare('SELECT COUNT(*) FROM leads WHERE status = \'failed\' AND spam = 0 AND created > ?');
        $q->execute([$since]);
        $failed = (int) $q->fetchColumn();
        if ($failed > 0) {
            $problems[] = 'leads:' . $failed;
        }

        // CRM: neodeslané (failed) a zaseknuté (pending déle než 2 min, proces skončil dřív) poslat znovu.
        if (wt_crm_enabled($cfg)) {
            $stuck = 'spam = 0 AND created > ? AND (crm = \'failed\' OR (crm = \'pending\' AND created < ?))';
            $q = $db->prepare("SELECT * FROM leads WHERE $stuck ORDER BY id LIMIT " . CRM_BATCH);
            $q->execute([$since, $now - 120]);
            $mark = $db->prepare('UPDATE leads SET crm = ? WHERE id = ?');
            foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $lead) {
                [$ok, $info] = wt_push_crm($lead, $cfg);
                $mark->execute([$ok ? 'sent' : 'failed', $lead['id']]);
                if (!$ok) {
                    error_log('health: lead ' . $lead['id'] . ' crm retry failed: ' . $info);
                }
            }
            $q = $db->prepare("SELECT COUNT(*) FROM leads WHERE $stuck");
            $q->execute([$since, $now - 120]);
            $crmFailed = (int) $q->fetchColumn();
            if ($crmFailed > 0) {
                $problems[] = 'crm:' . $crmFailed;
            }
        }
    } catch (Throwable $e) {
        error_log('health leads: ' . $e->getMessage());
        $problems[] = 'db';
    }
}

// --- příchozí pošta (inbound.php): přeposlání, které ani po 30 min neprošlo ---
if (is_file(WT_DATA_DIR . '/inbound.sqlite')) {
    try {
        $in = new PDO('sqlite:' . WT_DATA_DIR . '/inbound.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $in->exec('PRAGMA busy_timeout = 3000');
        $q = $in->prepare('SELECT COUNT(*) FROM inbound WHERE status IN (\'failed\', \'received\') AND created < ? AND created > ?');
        $q->execute([$now - 1800, $now - RETRY_DAYS * 86400]);
        $stuck = (int) $q->fetchColumn();
        if ($stuck > 0) {
            $problems[] = 'inbound:' . $stuck;
        }
    } catch (Throwable $e) {
        error_log('health inbound: ' . $e->getMessage());
        $problems[] = 'db';
    }
}

if ($problems) {
    http_response_code(503);
    echo 'FAIL ' . implode(' ', array_unique($problems)) . "\n";
    exit;
}
echo "OK\n";
