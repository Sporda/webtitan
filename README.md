# webtitan.cz

Web Jana Šporka (WebTitan) – webové a mobilní aplikace, weby a e-shopy na míru.

Lehký statický web skládaný v [Astru](https://astro.build) (`web/`) a několik malých PHP endpointů. Výstup je čisté HTML
jako dřív – žádný framework ani JavaScript navíc v prohlížeči, CSS i skripty stránek zůstávají vložené přímo ve stránce.
Astro slouží jen k tomu, aby se společné části (menu, patička, formulář, reference, služby, ceny, otázky) měnily
na jednom místě. Běží na hostingu v panelu (panel.webtitan.cz, nginx + PHP 8.3) na serveru `158.180.50.98`.

## Struktura

`web/` je projekt Astro; `npm run build` z něj vyrobí `web/dist/`, který se na server kopíruje do
`/var/www/webtitan/public_html`. Adresy stránek jsou stejné jako dřív (`/tvorba-webu/`, `/clanky/…/`,
`/ochrana-osobnich-udaju.html`, `/404.html`).

**Kde co upravit:**

| Co | Kde |
|---|---|
| Ceny, názvy a popisy služeb (patička, karty „Další služby“ a „Mohlo by vás zajímat“) | `web/src/data/sluzby.ts` |
| Reference (velké karty Zadání / Řešení / Přínos a malé náhledy) | `web/src/data/reference.ts`; na stránce `<RefCase id="…" />`, `<RefThumb id="…" />` |
| Časté otázky (jedna sada pro celý web; na stránce i v JSON-LD) | `web/src/data/otazky.ts`; stránka si je vybírá `otazky([...])` |
| Články: kategorie, nadpis, popis, datum, doba čtení, související | `web/src/data/clanky.ts`; text článku v `web/src/pages/clanky/<slug>/index.astro` |
| Telefon, e-mail, odkazy, IČO, **verze souborů `?v=`** (po změně `analytics.js`, `lead.js`, `motion.css`…) | `web/src/data/site.ts` |
| Údaje o mně a firmě pro vyhledávače (Person, ProfessionalService) | `web/src/data/schema.ts` |
| Hlavička stránky (SEO, sdílení, ikony, písma, skripty) | `web/src/layouts/Base.astro` |
| Menu, patička, kontaktní sekce podstránek, mobilní lišta | `web/src/components/Nav.astro`, `Footer.astro`, `LeadSection.astro`, `MobileBar.astro` |
| Obsah stránek | `web/src/pages/` (`index.astro` = úvodní stránka, `<služba>/index.astro`, `clanky/`) |
| Styly (vkládají se do stránky) | `web/src/styles/` – `home.css` úvod, `sub.css` podstránky a články, `article.css` doplněk článků, `simple.css` ochrana údajů a 404 |
| Hlavní skript úvodní stránky (rezervace, formuláře, kalkulačka) | `web/src/scripts/home.js` |
| Soubory, které se jen kopírují (obrázky, `lead.js`, `consent.js`, `analytics.js`, `motion.*`, písma, PHP, robots, sitemap) | `web/public/` |

| Soubor | Co dělá |
|---|---|
| `web/public/assets/lead.js`, `lead.css` | podstránky a články: formulář „Zavolejte mi / Napsat poptávku“ přímo na stránce (`#poptat`), okno při odchodu (`data-offer="app\|web"` na `<script>`), a na všech stránkách včetně hlavní: odkud návštěvník přišel (`window.wtSrc()`) |
| `web/public/api/contact.php` | formuláře (poptávka, 15min hovor, zavolání, bezplatná kontrola) → uloží do `data/leads.sqlite`, pošle mi e-mail, zákazníkovi krátké potvrzení (přes Resend) a s `CRM_TOKEN` i do CRM |
| `web/public/api/_mail.php` | sdílená knihovna: databáze poptávek, e-mail s poptávkou, potvrzení zákazníkovi (zvenku vrací 404) |
| `web/public/api/health.php` | pro hlídání dostupnosti: `OK` / `FAIL …`; zároveň znovu zkouší doručit poptávky, které napoprvé neodešly |
| `web/public/api/inbound.php` | webhook Resend Receiving: e-maily na `*@webtitan.cz` přepošle na `MAIL_TO` (ověřuje podpis, zápis do `data/inbound.sqlite`) |
| `web/public/robots.txt`, `sitemap.xml`, `favicon.ico` | pro vyhledávače a prohlížeče (sitemapu po přidání stránky nebo článku doplnit ručně) |
| `web/public/seznam-wmt-….txt` | ověření webu v Seznam Webmaster – nemazat, jinak ověření propadne |
| `web/public/index.php` | router pro nginx: `/` → `index.html`, neexistující adresy → `404.html` se stavem 404 |

Návrhy designů 1–14 a jejich lajkování byly z webu odstraněny – zůstávají v historii gitu (před commitem s úklidem).
Původní ručně psané HTML (před Astrem) je v historii gitu ve složce `site/`.

### Práce na webu

Potřebuje Node 22.23+ (`web/.nvmrc`: 24).

```bash
cd web
npm install
npm run dev       # náhled se změnami naživo: http://localhost:4321
npm run build     # sestaví web/dist/
npm run preview   # náhled sestaveného webu
```

PHP endpointy v náhledu Astra neběží (formuláře pak nabídnou odeslání e-mailem). S PHP nad sestaveným webem:
`env WT_DATA_DIR=/tmp/wtdata php -S 127.0.0.1:8000 -t web/dist` – `WT_DATA_DIR` přesměruje databázi a `contact.env`
mimo `/var/www` (na serveru se nenastavuje). Bez `RESEND_API_KEY` v `contact.env` se nic neodešle, poptávka se jen uloží.

**Nový článek:** přidat záznam do `web/src/data/clanky.ts` (nahoru, nejnovější první) a stránku
`web/src/pages/clanky/<slug>/index.astro` s textem uvnitř `<Article slug="…">…</Article>` – karta v rozcestníku,
JSON-LD a „Mohlo by vás zajímat“ se doplní samy. Pak adresu přidat do `web/public/sitemap.xml`.

### Poptávky z podstránek a odkud přišly

- Podstránky služeb a články mají vlastní formulář (`#poptat`): **Zavolejte mi** (jméno + telefon, zdroj `zavolat`, e-mail nepovinný) nebo **Napsat poptávku** (jméno, e-mail, text, zdroj `poptavka`). Všechna tlačítka na stránce na něj skáčou, na hlavní stránku se odtud nikdo posílat nemusí.
- `lead.js` si po dobu návštěvy (sessionStorage `wt7-src`) pamatuje, odkud návštěvník přišel: `utm_*`, reklamní kliknutí (`gclid` → Google Ads, `sznclid` → Sklik, `msclkid`, `fbclid`), doménu odkazu, první stránku a počet prošlých stránek. Formulář to posílá jako `src`; `_mail.php` z toho udělá srozumitelný kanál (`Sklik`, `Google (vyhledávání)`, `Odkaz z …`, `Přímo (bez odkazu)`…). Kanál je v e-mailu s poptávkou (řádek „Odkud“) a v CRM (pole `channel` + podrobnosti `attribution`).
- Odkazy, které chci v CRM rozlišit, označit: profil na Googlu `https://webtitan.cz/?utm_source=gbp&utm_medium=organic` (→ „Google profil firmy“), Firmy.cz `?utm_source=firmy.cz`, leták / QR kód `?utm_source=letak&utm_medium=qr` (→ „Kampaň: letak / qr“). Sklik a Google Ads se poznají samy podle automatického značkování.

### Měření konverzí a souhlas s cookies (`assets/consent.js`)

- Nahoře v souboru je `CONFIG`: `semId` (Sklik → Nástroje → Měřicí kód Seznamu), `gadsId` (`AW-…`) a štítky
  konverzí `gadsLead` / `gadsCheck` (`AW-…/…`), odhadované hodnoty poptávek v Kč. **Dokud jsou ID prázdná, soubor nedělá
  nic** – žádná lišta, nic se nenačítá.
- S vyplněným ID se ukáže lišta „Povolit / Jen nezbytné“ (stejně výrazná tlačítka). Měřicí kód Seznamu (`sul.js`) ani
  Google tag se **bez souhlasu nenačtou vůbec**. Volba platí rok, v patičce přibude „Nastavení cookies“.
- Formuláře po úspěšném odeslání volají `window.wtConversion("lead" | "check")` → Sklik `SEM('track', 'Lead', {currency: 'CZK', value})`
  a Google Ads `conversion`. Posílá se jen to, že poptávka vznikla, nikdy obsah ani kontakt.
- Po změně `consent.js` zvednout jeho verzi v `web/src/data/site.ts` (`V.consent`; soubory se v prohlížeči drží 30 dní).

### Animace

- Jen `opacity` / `transform` (bez přepočtu rozvržení), s `prefers-reduced-motion: reduce` se nic nehýbe a nic není schované.
- Úvod (hlavní stránka `.hero .bento > .card`, podstránky `.sp-hero .card`) je vidět od prvního vykreslení a jen se
  jemně usadí – nikdy ho neschovávat průhledností (zdrželo by to LCP).
- Mikrointerakce (stisk tlačítek, přejíždějící přepínače, zvýraznění formuláře po kliknutí) jsou ve sdílené vrstvě
  `assets/motion.css` a `motion.js` na všech stránkách.
- Objevení při posouvání: hlavní stránka třída `.rv` (skrývá se jen s `html.js`), podstránky a články ji `lead.js`
  dává jen kartám pod prvním zobrazením; text článků se nehýbe. Sourozenci postupně (`--d`, nejvýš 280 ms).
- Čísla 20+ a 23 v úvodu naběhnou, otázky se rozbalují plynule (`::details-content`, kde to prohlížeč umí),
  fajfka po odeslání se dokreslí, mezi stránkami krátké prolnutí (`@view-transition`, hlavička zůstává na místě).
- Lišta s tlačítkem na mobilu na podstránkách vyjede až pod úvodem (`.mbar.on`).

### Telefon a písma

- Telefon 723 793 510 je v hlavičce (na úzkých podstránkách jen v liště dole), v úvodu stránek, v liště na mobilu, u formuláře,
  v patičce, v JSON-LD (`telephone`) a v podpisu potvrzovacího e-mailu. Kliknutí se měří jako `cta_click` s `*_tel`.
- Písma v `assets/fonts` jsou zmenšená jen na znaky češtiny a slovenštiny (Unbounded 71 → 40 kB, Manrope 34 → 22 kB);
  `unicode-range` v `fonts.css` i ve vložených `@font-face` (hlavní stránka, 404, zásady) odpovídá obsahu souborů.
  Náhradní písma `Unbounded Fallback` / `Manrope Fallback` (Arial zvětšený na stejnou šířku) brání poskakování stránky.

## Data a konfigurace na serveru

Mimo web i git, ve složce `/var/www/webtitan/data` (vlastník `webtitan`, práva 700). Nasazení ji nikdy nepřepisuje.

- `leads.sqlite` – všechny poptávky z formulářů (záloha k e-mailům)
- `inbound.sqlite` – přijaté e-maily na `@webtitan.cz`
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

Po pushi do `main`, který mění `web/`, `scripts/deploy.sh` nebo workflow, se web nasadí automaticky přes GitHub Actions
(`.github/workflows/deploy.yml`): sestaví web (`npm ci && npm run build` ve `web/`; když build selže, nenasadí se nic),
zkopíruje `web/dist/` na server, nastaví vlastníka a práva a ověří, že stránky i endpointy odpovídají. Ručně jde
workflow spustit v záložce Actions („Run workflow“).

Ruční nasazení z počítače (web musí být sestavený):

```bash
(cd web && npm ci && npm run build)
env DEPLOY_HOST=158.180.50.98 DEPLOY_USER=ubuntu bash scripts/deploy.sh
```

Nasazení kopíruje bez mazání: soubor smazaný z webu je potřeba odstranit i na serveru ručně.

GitHub secrets, které nasazení používá: `SERVER_HOST`, `SERVER_USERNAME`, `SERVER_PORT`, `SSH_PRIVATE_KEY`.

## Starý web

Původní Next.js web (s adminem, MongoDB a Dockerem) je v historii gitu – poslední verze v commitu `f3b2ef5`.
