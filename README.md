# webtitan.cz

Web Jana Šporka (WebTitan) – webové a mobilní aplikace, weby a e-shopy na míru.

Lehký statický web: HTML + CSS + JS bez buildu a několik malých PHP endpointů. Žádný Node.js, framework ani Docker.
Běží na hostingu v panelu (panel.webtitan.cz, nginx + PHP 8.3) na serveru `158.180.50.98`.

## Struktura

Složka `site/` se na server kopíruje 1:1 do `/var/www/webtitan/public_html`.

| Soubor | Co dělá |
|---|---|
| `site/index.html` | hlavní stránka (vznikla z návrhu 8 – Levandule), SEO, JSON-LD, formuláře |
| `site/ochrana-osobnich-udaju.html` | zásady ochrany osobních údajů |
| `site/assets/` | obrázky webu (fotka ve WebP, OG obrázek, ikony, náhledy projektů) |
| `site/api/contact.php` | formuláře (poptávka, 15min hovor, bezplatná kontrola) → uloží do `data/leads.sqlite`, pošle mi e-mail, zákazníkovi krátké potvrzení (přes Resend) a s `CRM_TOKEN` i do CRM |
| `site/api/_mail.php` | sdílená knihovna: databáze poptávek, e-mail s poptávkou, potvrzení zákazníkovi (zvenku vrací 404) |
| `site/api/health.php` | pro hlídání dostupnosti: `OK` / `FAIL …`; zároveň znovu zkouší doručit poptávky, které napoprvé neodešly |
| `site/api/inbound.php` | webhook Resend Receiving: e-maily na `*@webtitan.cz` přepošle na `MAIL_TO` (ověřuje podpis, zápis do `data/inbound.sqlite`) |
| `site/robots.txt`, `site/sitemap.xml`, `site/favicon.ico` | pro vyhledávače a prohlížeče |
| `site/designs.html` | rozcestník návrhů s náhledy a lajkováním (`noindex`) |
| `site/design<N>.html`, `site/design-assets/` | jednotlivé návrhy a jejich obrázky |
| `site/api/likes.php` | lajky návrhů (jeden návštěvník = jeden lajk na návrh, `data/likes.sqlite`) |

Lokální náhled: `python3 -m http.server 8000 --directory site` (PHP endpointy lokálně neběží – formuláře pak nabídnou odeslání e-mailem).

## Data a konfigurace na serveru

Mimo web i git, ve složce `/var/www/webtitan/data` (vlastník `webtitan`, práva 700). Nasazení ji nikdy nepřepisuje.

- `leads.sqlite` – všechny poptávky z formulářů (záloha k e-mailům)
- `inbound.sqlite` – přijaté e-maily na `@webtitan.cz`
- `likes.sqlite` – lajky návrhů
- `contact.env` – konfigurace e-mailu:

```
RESEND_API_KEY=re_…            # odesílání (stačí „Sending access“)
RESEND_FULL_API_KEY=re_…       # čtení přijatých e-mailů („Full access“) – pro inbound.php
RESEND_WEBHOOK_SECRET=whsec_…  # podpisový klíč webhooku email.received → https://webtitan.cz/api/inbound.php
MAIL_TO=adresa, kam chodí poptávky i přeposlané e-maily
MAIL_FROM=WebTitan <kontakt@webtitan.cz>
# volitelně:
CONFIRM_FROM=Jan Šporek – WebTitan <kontakt@webtitan.cz>   # odesílatel potvrzení zákazníkovi
CONFIRM=0                                                # vypne potvrzení zákazníkovi
CRM_TOKEN=dcrm_…   # token pro zápis z crm.webtitan.cz (Můj účet → API tokeny) → poptávky jdou i do CRM (Poptávky)
CRM_URL=https://crm.webtitan.cz/api/v1/leads             # výchozí hodnota
```

## E-mail

- Odesílání i příjem běží přes Resend, doména `webtitan.cz` (region eu-west-1).
- DNS je ve WEDOS: DKIM `resend._domainkey`, SPF/MX pro `send`, MX `webtitan.cz → 10 receive-euw1.forge.rmta.net` (příjem).
- Server sám poštu neposílá ani nepřijímá (Oracle Cloud blokuje port 25).
- Potvrzení zákazníkovi záměrně neopakuje nic z formuláře (ani jméno, ani zprávu) a jedna adresa dostane nejvýš 2 za den,
  aby formulář nešel zneužít k posílání vlastního textu na cizí adresy. Odpověď na potvrzení jde na kontakt@ → přes inbound.php ke mně.

## Hlídání (UptimeRobot)

`https://webtitan.cz/api/health.php` vrací `OK` (200), nebo `FAIL …` (503):

- `config` – chybí klíč k Resendu nebo adresát v `contact.env`
- `leads:N` – N poptávek za poslední 3 dny se nepodařilo doručit (zkouší se znovu při každém volání: první hodinu
  po 4 min, pak po hodině; poptávku, kterou zákazník mezitím odeslal znovu úspěšně, už neposílá)
- `crm:N` – N poptávek se nepodařilo poslat do CRM (zkouší se znovu při každém volání; stejné `externalId`
  `webtitan.cz:<id>` zajistí, že v CRM nevznikne duplicita)
- `inbound:N` – N příchozích e-mailů se ani po 30 min nepodařilo přeposlat
- `db` – databázi nejde otevřít

Monitor typu Keyword (hledá `OK`) každých 5 min na tuto adresu + druhý na `https://webtitan.cz/` → upozornění e-mailem
nebo do aplikace v telefonu, když web spadne nebo se poptávka zasekne.

## Nasazení

Po pushi do `main`, který mění `site/`, `scripts/deploy.sh` nebo workflow, se web nasadí automaticky přes GitHub Actions
(`.github/workflows/deploy.yml`): zkopíruje `site/` na server, nastaví vlastníka a práva a ověří, že stránky
i endpointy odpovídají. Ručně jde workflow spustit v záložce Actions („Run workflow“).

Ruční nasazení z počítače:

```bash
env DEPLOY_HOST=158.180.50.98 DEPLOY_USER=ubuntu bash scripts/deploy.sh
```

GitHub secrets, které nasazení používá: `SERVER_HOST`, `SERVER_USERNAME`, `SERVER_PORT`, `SSH_PRIVATE_KEY`.

## Starý web

Původní Next.js web (s adminem, MongoDB a Dockerem) je v historii gitu – poslední verze v commitu `f3b2ef5`.
