<?php
declare(strict_types=1);

/*
 * Sdílená knihovna poptávek (používají ji contact.php a health.php):
 * databáze data/leads.sqlite, e-mail s poptávkou pro mě a potvrzení pro zákazníka přes Resend API.
 * Při přímém otevření v prohlížeči vrací 404 – nic neodesílá a nic nevypisuje.
 */

if (basename((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === '_mail.php') {
    http_response_code(404);
    exit;
}

const WT_DATA_DIR = '/var/www/webtitan/data';
const WT_SOURCES = [
    'poptavka' => 'Nová poptávka',
    'hovor'    => 'Žádost o 15min hovor',
    'kontrola' => 'Bezplatná kontrola / posouzení',
    'exit'     => 'Bezplatná kontrola (okno při odchodu)',
];
/** Kolik potvrzení smí za 24 h dostat jedna adresa (ochrana proti zneužití formuláře k obtěžování cizích adres). */
const WT_CONFIRM_PER_DAY = 2;

/**
 * Konfigurace z data/contact.env: RESEND_API_KEY, MAIL_TO, MAIL_FROM; volitelně CONFIRM_FROM, CONFIRM=0,
 * CRM_TOKEN (token pro zápis z crm.webtitan.cz → Můj účet → API tokeny) a CRM_URL.
 */
function wt_config(): array
{
    $cfg = [];
    $file = WT_DATA_DIR . '/contact.env';
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

/**
 * Databáze poptávek; založí tabulku a doplní sloupce, které přibyly později:
 * attempts / last_try = opakované doručení (health.php), confirm = stav potvrzení zákazníkovi.
 */
function wt_leads_db(): PDO
{
    $db = new PDO('sqlite:' . WT_DATA_DIR . '/leads.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
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
    $have = array_column($db->query('PRAGMA table_info(leads)')->fetchAll(PDO::FETCH_ASSOC), 'name');
    $add = [
        'attempts' => 'INTEGER NOT NULL DEFAULT 0',
        'last_try' => 'INTEGER NOT NULL DEFAULT 0',
        'confirm'  => 'TEXT NOT NULL DEFAULT \'\'',
        // '' = CRM není nastavené, pending = čeká na odeslání, sent / failed
        'crm'      => 'TEXT NOT NULL DEFAULT \'\'',
    ];
    foreach ($add as $col => $def) {
        if (!in_array($col, $have, true)) {
            $db->exec("ALTER TABLE leads ADD COLUMN $col $def");
        }
    }
    return $db;
}

/** POST na Resend /emails. Vrací [bool ok, string info] – info je id e-mailu, nebo popis chyby. */
function wt_resend(array $body, string $key): array
{
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json',
            'User-Agent: webtitan-contact/1.1',
        ],
    ]);
    $resp = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);

    if ($resp !== false && $code >= 200 && $code < 300) {
        return [true, (string) (json_decode((string) $resp, true)['id'] ?? '')];
    }
    return [false, $err !== '' ? 'curl: ' . $err : 'resend ' . $code . ': ' . mb_substr((string) $resp, 0, 300)];
}

function wt_h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * E-mail s poptávkou pro mě. Odpověď na něj jde rovnou zákazníkovi (reply_to).
 * $lead: id, created, source, name, email, phone, message, page. $retry = opakované doručení (značka v předmětu).
 */
function wt_send_lead(array $lead, array $cfg, bool $retry = false): array
{
    $key = (string) ($cfg['RESEND_API_KEY'] ?? '');
    $to = (string) ($cfg['MAIL_TO'] ?? '');
    $from = (string) ($cfg['MAIL_FROM'] ?? 'WebTitan <kontakt@webtitan.cz>');
    if ($key === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return [false, 'not configured'];
    }

    $source = (string) ($lead['source'] ?? 'poptavka');
    $name = (string) ($lead['name'] ?? '');
    $email = (string) ($lead['email'] ?? '');
    $phone = (string) ($lead['phone'] ?? '');
    $message = (string) ($lead['message'] ?? '');
    $page = (string) ($lead['page'] ?? '');
    $label = WT_SOURCES[$source] ?? 'Poptávka z webu';

    $type = preg_match('/^Typ:\s*(.+)$/mu', $message, $m) ? mb_substr(trim($m[1]), 0, 60) : '';
    $subject = ($retry ? '[opakované doručení] ' : '') . $label . ($type !== '' ? ' – ' . $type : '') . ' – ' . $name;
    $subject = mb_substr(str_replace(["\r", "\n"], ' ', $subject), 0, 250);
    $when = (new DateTimeImmutable('@' . (int) ($lead['created'] ?? time())))
        ->setTimezone(new DateTimeZone('Europe/Prague'))->format('j. n. Y H:i');

    $rows = [
        ['Formulář', wt_h($label)],
        ['Jméno', wt_h($name)],
        ['E-mail', '<a href="mailto:' . wt_h($email) . '">' . wt_h($email) . '</a>'],
    ];
    if ($phone !== '') {
        $rows[] = ['Telefon', '<a href="tel:' . wt_h((string) preg_replace('/[^0-9+]/', '', $phone)) . '">' . wt_h($phone) . '</a>'];
    }
    $rows[] = ['Odesláno', wt_h($when) . ' · ' . wt_h($page !== '' ? $page : '/')];
    $tr = '';
    foreach ($rows as [$k, $v]) {
        $tr .= '<tr><td style="padding:6px 14px 6px 0;color:#4d5a52;white-space:nowrap;vertical-align:top">' . $k
             . '</td><td style="padding:6px 0;color:#1b342c;font-weight:600">' . $v . '</td></tr>';
    }
    $retryNote = $retry
        ? '<p style="margin:0 0 14px;padding:10px 12px;background:#ffe0d3;border-radius:8px;font-size:14px;color:#9c3008">'
          . 'Tuto poptávku se napoprvé nepodařilo doručit, posílám ji znovu. Zákazník viděl chybu, možná mezitím napsal i&nbsp;e-mailem.</p>'
        : '';
    $html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1b342c">'
          . '<div style="height:6px;background:#ff6b3d;border-radius:6px 6px 0 0"></div>'
          . '<div style="background:#faf6ef;border:1px solid #e0d5c3;border-top:0;border-radius:0 0 12px 12px;padding:22px 24px">'
          . $retryNote
          . '<h2 style="margin:0 0 14px;font-size:20px;color:#1f3d34">' . wt_h($label) . '</h2>'
          . '<table style="border-collapse:collapse;font-size:15px">' . $tr . '</table>'
          . '<div style="margin-top:18px;padding:16px 18px;background:#ffffff;border:1px solid #e0d5c3;border-radius:10px;'
          . 'white-space:pre-wrap;font-size:15px;line-height:1.55">' . wt_h($message) . '</div>'
          . '<p style="margin:16px 0 0;font-size:13px;color:#4d5a52">Odpovězte přímo na tento e-mail – odpověď půjde zákazníkovi ('
          . wt_h($email) . ').</p></div></div>';
    $text = ($retry ? "[Opakované doručení – napoprvé se nepodařilo odeslat]\n\n" : '')
          . $label . "\n\nJméno: $name\nE-mail: $email\n" . ($phone !== '' ? "Telefon: $phone\n" : '')
          . "Odesláno: $when · " . ($page !== '' ? $page : '/') . "\n\n$message\n\n"
          . "Odpovězte přímo na tento e-mail – odpověď půjde zákazníkovi.\n";

    $body = ['from' => $from, 'to' => [$to], 'subject' => $subject, 'html' => $html, 'text' => $text];
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $body['reply_to'] = $email;
    }
    return wt_resend($body, $key);
}

function wt_crm_enabled(array $cfg): bool
{
    return ($cfg['CRM_TOKEN'] ?? '') !== '';
}

/**
 * Pošle poptávku do CRM (crm.webtitan.cz → Poptávky). externalId „webtitan.cz:<id>“ zajistí, že opakované
 * odeslání (health.php) nezaloží v CRM duplicitu. Vrací [bool ok, string info] – info je id v CRM, nebo chyba.
 */
function wt_push_crm(array $lead, array $cfg): array
{
    $token = (string) ($cfg['CRM_TOKEN'] ?? '');
    if ($token === '') {
        return [false, 'not configured'];
    }
    $page = (string) ($lead['page'] ?? '');
    $body = [
        'name'       => (string) ($lead['name'] ?? ''),
        'email'      => ($lead['email'] ?? '') !== '' ? (string) $lead['email'] : null,
        'phone'      => ($lead['phone'] ?? '') !== '' ? (string) $lead['phone'] : null,
        'message'    => (string) ($lead['message'] ?? ''),
        'source'     => WT_SOURCES[(string) ($lead['source'] ?? '')] ?? 'Poptávka z webu',
        'page'       => 'https://webtitan.cz' . (str_starts_with($page, '/') ? $page : '/'),
        'externalId' => 'webtitan.cz:' . (int) ($lead['id'] ?? 0),
        'receivedAt' => gmdate('Y-m-d\TH:i:s\Z', (int) ($lead['created'] ?? time())),
    ];
    $ch = curl_init((string) ($cfg['CRM_URL'] ?? 'https://crm.webtitan.cz/api/v1/leads'));
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
            'User-Agent: webtitan-contact/1.1',
        ],
    ]);
    $resp = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    if ($resp !== false && ($code === 200 || $code === 201)) {
        return [true, (string) (json_decode((string) $resp, true)['id'] ?? '')];
    }
    return [false, $err !== '' ? 'curl: ' . $err : 'crm ' . $code . ': ' . mb_substr((string) $resp, 0, 300)];
}

/** Smí adresa dostat potvrzení? (nejvýš WT_CONFIRM_PER_DAY za 24 h, CONFIRM=0 v contact.env potvrzení vypne) */
function wt_confirm_allowed(PDO $db, array $cfg, string $email, int $now): bool
{
    if (($cfg['CONFIRM'] ?? '1') === '0' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    $q = $db->prepare('SELECT COUNT(*) FROM leads WHERE lower(email) = lower(?) AND confirm = \'sent\' AND created > ?');
    $q->execute([$email, $now - 86400]);
    return (int) $q->fetchColumn() < WT_CONFIRM_PER_DAY;
}

/**
 * Potvrzení pro zákazníka, že poptávka dorazila. Záměrně neopakuje nic z toho, co do formuláře napsal
 * (ani jméno, ani zprávu) – kdyby někdo vyplnil cizí adresu, nedá se formulář použít k rozesílání vlastního textu.
 * Odpověď na potvrzení jde na kontakt@webtitan.cz (od koho je e-mail) → přes inbound.php ke mně.
 */
function wt_send_confirmation(array $lead, array $cfg): array
{
    $key = (string) ($cfg['RESEND_API_KEY'] ?? '');
    $email = (string) ($lead['email'] ?? '');
    $from = (string) ($cfg['CONFIRM_FROM'] ?? 'Jan Šporek – WebTitan <kontakt@webtitan.cz>');
    if ($key === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return [false, 'not configured'];
    }
    $source = (string) ($lead['source'] ?? 'poptavka');
    [$subject, $lines] = match ($source) {
        'hovor' => [
            'Žádost o 15min hovor mám – termín potvrdím do 24 hodin',
            [
                'děkuji za zájem o 15minutový hovor, žádost mi dorazila v pořádku.',
                'Termín vám potvrdím e-mailem do 24 hodin (v pracovní dny). Kdyby vám vybraný čas přestal vyhovovat, stačí odpovědět na tento e-mail a domluvíme jiný.',
            ],
        ],
        'kontrola', 'exit' => [
            'Děkuji – tipy pro váš web pošlu do 2 pracovních dnů',
            [
                'děkuji, žádost o bezplatnou kontrolu mi dorazila v pořádku.',
                'Do 2 pracovních dnů vám pošlu konkrétní tipy, co na webu zlepšit. Je to zdarma a bez závazku, žádné obchodní telefonáty nečekejte.',
            ],
        ],
        default => [
            'Děkuji za poptávku – ozvu se do 24 hodin',
            [
                'děkuji za vaši poptávku z webtitan.cz, dorazila mi v pořádku.',
                'Projdu ji a do 24 hodin (v pracovní dny) se vám ozvu osobně – e-mailem, nebo zavolám, pokud jste nechali telefon.',
                'Kdybyste chtěli něco doplnit (podklady, odkaz, představu o termínu), stačí odpovědět na tento e-mail.',
            ],
        ],
    };
    $ps = '';
    foreach ($lines as $l) {
        $ps .= '<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1b342c">' . wt_h($l) . '</p>';
    }
    $html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1b342c">'
          . '<div style="height:6px;background:#ff6b3d;border-radius:6px 6px 0 0"></div>'
          . '<div style="background:#faf6ef;border:1px solid #e0d5c3;border-top:0;border-radius:0 0 12px 12px;padding:24px 26px">'
          . '<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1b342c">Dobrý den,</p>'
          . $ps
          . '<p style="margin:18px 0 0;font-size:16px;line-height:1.6;color:#1b342c">S pozdravem<br><strong style="color:#1f3d34">Jan Šporek</strong><br>'
          . '<a href="https://webtitan.cz" style="color:#1f3d34">WebTitan</a> · vývoj aplikací, weby a e-shopy<br>'
          . '<a href="mailto:kontakt@webtitan.cz" style="color:#1f3d34">kontakt@webtitan.cz</a></p>'
          . '</div>'
          . '<p style="margin:14px 4px 0;font-size:12px;line-height:1.5;color:#4d5a52">Tento e-mail přišel, protože někdo s&nbsp;vaší adresou '
          . 'vyplnil formulář na webtitan.cz. Pokud jste to nebyli vy, e-mail prosím ignorujte – nic dalšího vám posílat nebudu.</p>'
          . '</div>';
    $text = "Dobrý den,\n\n" . implode("\n\n", $lines)
          . "\n\nS pozdravem\nJan Šporek\nWebTitan · https://webtitan.cz\nkontakt@webtitan.cz\n\n--\n"
          . "Tento e-mail přišel, protože někdo s vaší adresou vyplnil formulář na webtitan.cz. "
          . "Pokud jste to nebyli vy, e-mail prosím ignorujte.\n";

    return wt_resend([
        'from'    => $from,
        'to'      => [$email],
        'subject' => $subject,
        'html'    => $html,
        'text'    => $text,
        // automatické odpovědi (dovolená apod.) na potvrzení neodpovídají → žádné smyčky přes inbound.php
        'headers' => ['Auto-Submitted' => 'auto-generated'],
    ], $key);
}
