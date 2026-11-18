# Plán: převod webtitan.cz na Astro

Stav: **provedeno ve větvi `astro`** (18. 11. 2026). Web je ve `web/` (Astro 7, statický výstup, CSS a skripty vložené
ve stránkách jako dřív), stará složka `site/` je odstraněná (zůstává v historii gitu). Výstup jsem ověřil porovnáním
všech 18 stránek se starým webem (značky, atributy, texty, JSON-LD) a screenshoty na 1440 a 500 px – liší se jen
záměrná sjednocení (patička 404 a ochrany údajů, nezlomitelné mezery v cenách, popis karty vývoje aplikací,
meta značky ochrany údajů, drobečková navigace článku o zákonu, jedno CSS pravidlo navíc u článků).
Oproti plánu: CSS zůstává vložené (`inlineStylesheets: "always"`) – stejný výkon jako dřív; články zůstaly jako HTML
v `.astro` (ne Markdown) kvůli vlastním blokům (callout, výzva s tlačítky); sitemapa je zatím ruční.

Původní plán:

## Proč

Web je dnes čisté HTML ve složce `site/` – rychlé a jednoduché, ale každá společná změna se dělá ručně na všech
stránkách (menu, patička, hlavička, formulář, reference, ceny, verze skriptů `?v=`).

Změřeno 18. 11. 2026 (18 stránek):

| Co | Hodnota |
|---|---|
| HTML celkem | 960 KB |
| z toho CSS vložené do každé stránky | 428 KB (podstránky 21–24 KB každá, úvodní 69 KB) |
| CSS sdílené beze změny | 212 z 251 pravidel je stejných na všech 15 podstránkách |
| vložený JS na úvodní stránce | 46 KB |
| menu (`.nav-wrap`) | 17 různých variant na 18 stránkách – rozjíždí se |
| patička | 11 variant |
| ikony (SVG sprite) | 2 varianty na 16 stránkách |
| mobilní lišta | 3 varianty na 15 stránkách |

Příklady duplicity: reference Fitness Ural a VB porcelán se upravovaly na 2–3 stránkách, verze `motion.css`,
`analytics.js` a favicon se zvedaly ve všech 18 souborech, ceny („od 24 950 Kč“…) jsou v textech, meta popisech
i strukturovaných datech na mnoha místech.

## Cíl

Stejný výstup jako dnes (statické HTML, žádný framework v prohlížeči, žádný JS navíc), ale zdroj rozdělený na
komponenty a data, takže se společná věc mění na jednom místě. Výkon stejný nebo lepší.

## Proč Astro (a ne Eleventy / vlastní skript)

- Výstup je čisté HTML, JS do prohlížeče jde jen tam, kde ho stránka sama má (dnešní vložené skripty zůstanou).
- Uživatel ho už zná a používá (konfigurátor BMP, Moje bojovka).
- Komponenty s parametry (karta reference, karta služby), data v TS/JSON, články v Markdownu (content collections),
  optimalizace obrázků (`astro:assets` – WebP/AVIF a velikosti), sitemap.
- Sdílené CSS jako jeden soubor s otiskem v názvu → prohlížeč ho stáhne jednou a pak bere z cache
  (dnes se 21–24 KB stahuje znovu na každé stránce). Malé styly umí Astro vložit přímo
  (`build.inlineStylesheets: "auto"`), takže se nepřidá žádný blokující požadavek navíc.
- Eleventy by stačilo na skládání šablon, ale bez komponent s daty a obrázků; vlastní skript = další věc na údržbu.

## Struktura

```
web/                      (nový projekt Astro; site/ zůstává, dokud se nepřepne nasazení)
  astro.config.mjs        site: "https://webtitan.cz", trailingSlash: "always", build.format: "directory",
                          build.inlineStylesheets: "auto"
  public/                 kopíruje se beze změny: api/*.php, index.php (router), robots.txt, favicon.ico,
                          seznam-wmt-*.txt, assets/fonts, assets/*.js (analytics, consent, lead, motion), og.jpg
  src/
    layouts/Base.astro    <head>: title, description, canonical, OG, ikony, JSON-LD (props); skripty
                          analytics/consent/motion; Nav + Footer + Sprite + MobileBar
    layouts/Article.astro článek: hlavička, obsah, souvisejících pár článků, formulář
    components/           Nav.astro (aktivní položka podle URL), Footer.astro, Sprite.astro, MobileBar.astro,
                          LeadForm.astro (formulář podstránek), ExitDialog.astro, ReferenceCase.astro,
                          ReferenceThumb.astro, ServiceCard.astro, Faq.astro
    data/                 reference.ts (všechny projekty: název, popis, obrázek, odkaz, data-rel, kde se ukazují),
                          sluzby.ts (služby a ceny – jedno místo pro „od 24 950 Kč“ atd.), kontakt.ts
    content/clanky/       9 článků v Markdownu (+ frontmatter: titulek, popis, datum, obrázek)
    pages/                index.astro, tvorba-webu/, tvorba-e-shopu/, vyvoj-aplikaci-na-miru/, mobilni-aplikace/,
                          sprava-serveru/, sprava-it-a-siti/, clanky/index.astro, clanky/[slug].astro,
                          ochrana-osobnich-udaju.astro, 404.astro
    styles/global.css     sdílená pravidla (těch 212) + motion.css; zbytek jako styl stránky/komponenty
```

Adresy zůstanou stejné (`/tvorba-webu/`, `/clanky/…/`, `/ochrana-osobnich-udaju.html`, `/404.html`) – SEO se nemění.
Pozor na `ochrana-osobnich-udaju.html` a `404.html`: jsou to soubory, ne složky (v Astru stránka s `build.format`
pro ně zvlášť, nebo přesměrování – ověřit, že výstup má přesně tyto názvy).

## Postup

1. **Větev / worktree** `astro`, projekt ve `web/`. `site/` se nemění.
2. **Kostra:** Base layout, Nav, Footer, Sprite, MobileBar; jedna podstránka (`tvorba-webu`) celá v Astru.
   Porovnat výstup s dnešní stránkou (viz Ověření) – teprve pak dál.
3. **Data:** `reference.ts` a `sluzby.ts`; karty referencí a služeb z dat (úvodní, tvorba-webu, tvorba-e-shopu,
   vývoj aplikací). Při převodu sjednotit 17 variant menu a 11 patiček – rozdíly projít a vybrat správné.
4. **Ostatní podstránky**, pak **články** do Markdownu, **úvodní stránka** nakonec (je největší: 216 KB,
   vlastní vložené skripty – kalkulačka, rezervace, rychlá poptávka, výměna služeb).
5. **CSS:** sdílená pravidla do `global.css`, specifická ke stránce/komponentě. Vložené skripty zatím nechat jako
   jsou (`<script is:inline>`), přesun do souborů až potom, s měřením.
6. **Obrázky:** `assets/projects/*.webp` přes `astro:assets` (WebP/AVIF, `srcset`), jen kde to výstup zlepší.
7. **Nasazení:** v `.github/workflows/deploy.yml` přidat Node + `npm ci && npm run build` ve `web/`;
   `scripts/deploy.sh` kopíruje `web/dist/` místo `site/`, kontroly po nasazení beze změny.
   Workflow se dnes spouští jen při změně `site/**` – přidat `web/**` (jinak se změny ve zdroji nenasadí).
   **Pozor:** deploy kopíruje bez mazání – staré soubory `_astro/*` s otiskem by se na serveru hromadily.
   Buď mazat jen složku `_astro/` (rsync `--delete` omezený na ni), nebo ji při deployi uklízet po N dnech.
8. **Přepnutí:** až výstup sedí, nasadit z `web/dist`, ověřit na webu, pak `site/` smazat (je v historii gitu).

## Ověření (před přepnutím nasazení)

- Skript porovná pro každou stránku starou a novou verzi: viditelný text, odkazy, `<title>`, meta popis, canonical,
  OG, JSON-LD, `alt` obrázků, formulářová pole (`name`, `id`). Rozdíl jen tam, kde je záměr (sjednocené menu).
- Screenshoty 1440 / 820 / 390 staré a nové verze vedle sebe (headless Chrome, jako dosud).
- Výkon: velikost přenesených dat na první a druhou stránku návštěvy, LCP a CLS (Lighthouse) – nesmí se zhoršit.
- Formuláře: odeslání poptávky a rezervace hovoru přes `api/contact.php` na zkušebním nasazení.
- `deploy.sh` kontroly (200/404/405) projdou.

## Rizika

- Úvodní stránka má hodně vlastního JS navázaného na přesnou strukturu HTML – převádět ji poslední a beze změn markupu.
- Dvě různé verze stejného bloku (menu, patička) – při sjednocení může zmizet drobnost, kterou některá stránka měla záměrně.
- Build krok v nasazení: když build selže, nenasadí se nic (to je dobře), ale je potřeba Node v Actions.
- Hosting: nginx + `index.php` router zůstávají; ověřit, že `404.html` a `index.html` jsou na stejných místech.

## Odhad

Kostra + jedna podstránka s ověřením: pár hodin. Celý web včetně úvodní stránky a nasazení: zhruba 1–2 dny práce,
podle toho, kolik rozdílů mezi variantami menu a patičky bude potřeba rozhodnout.
