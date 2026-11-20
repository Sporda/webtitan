# Branding pro Facebook a Instagram

Navazuje na branding pro Firmy.cz (`../firmy-cz-branding/`): stejné barvy, písma z webu (Unbounded + Manrope),
helma z loga, zelený přechod, tečkový rastr a vlnité linky s jednou oranžovou.
Všechna grafika je vlastní vektorová (helma vektorizovaná z `firmy-cz-branding/zdroj/helma.png`, ikony nakreslené
v `templates/ikony.svg`). Jediné bitmapové podklady jsou screenshoty projektů v `podklady/`. Žádné fotky ani obličeje.

## Soubory

| Soubor | Rozměr | K čemu |
|---|---|---|
| `profile-1080.png` | 1080×1080 | profilová fotka FB i IG (jen helma, ořez do kruhu) |
| `fb-cover-1640x624.png` | 1640×624 | titulní fotka Facebooku (2× pro 820×312) |
| `post-01-predstaveni.png` | 1080×1350 | úvodní příspěvek: „Ahoj, jsme WebTitan“ |
| `post-02-sluzby.png` | 1080×1350 | služby ve 4 blocích s ikonami |
| `post-03-ukazka.png` | 1080×1350 | ukázka práce: 3D konfigurátor BMP v notebooku a telefonu |
| `story-template-1080x1920.png` | 1080×1920 | prázdná story (horních a dolních 250 px bez obsahu) |
| `story-kontakt.png` | 1080×1920 | story s telefonem a e-mailem do zvýrazněného příběhu Kontakt |
| `highlight-sluzby.png`, `-ukazky`, `-kontakt`, `-recenze` | 1080×1920 | obaly zvýrazněných příběhů |
| `reklamy/reklama-web-feed-1080x1350.png`, `reklama-web-story-1080x1920.png` | 1080×1350, 1080×1920 | reklama A (Meta Ads): tvorba webu, ukázka fitnessural.cz, od 9 970 Kč |
| `reklamy/reklama-app-feed-1080x1350.png`, `reklama-app-story-1080x1920.png` | 1080×1350, 1080×1920 | reklama B: aplikace místo Excelu, ukázka ePodnikám, od 24 950 Kč |
| `reklamy/reklama-voucher-feed-1080x1350.png`, `reklama-voucher-story-1080x1920.png` | 1080×1350, 1080×1920 | reklama C: Vouchery pro podnikatele II (jen Karlovarský kraj), typografická s ikonami |
| `nahledy/` | | kontrola ořezu: kruh profilovky, titulka na desktopu (851×315) a mobilu (640×360), mřížka IG (3:4), highlighty, reklamy ve feedu zmenšené na 30 % (`reklamy-feed-30pct.png`) a ve story se zónami rozhraní (`reklamy-story-zony-ui.png`) |
| `sablony-prazdne/` | 1080×1350, 1080×1920 | vzory šablon: ukázka bez screenshotu, univerzální textový příspěvek, story s textem |
| `podklady/` | | screenshoty pro ukázky: konfigurátor a fitnessural.cz (desktop 2880×1800, mobil 1170×2532), ePodnikám (1036×497, výřez z `materialy/firmy-cz/galerie/15-epodnikam.jpg`, ukázková data) |
| `templates/` | | HTML/SVG šablony, texty (`obsah.json`) a skripty pro render |

Postup založení profilů a co kam nahrát: [`materialy/propagace/inzeraty/facebook/README.md`](../materialy/propagace/inzeraty/facebook/README.md).

**Na co si dát pozor při nahrávání**

- **Titulní fotka:** mobil ořízne ~265 px z každého boku, desktop ~9 px nahoře a dole. Logo i texty jsou ve středovém
  sloupci 700 px, takže v obou případech zůstanou celé (viz `nahledy/`).
- **Příspěvky:** mřížka profilu Instagramu ukazuje výřez 3:4. U formátu 4:5 to znamená ořez ~34 px z boků (ne nahoře
  a dole). Obsah má okraj 80 px ze všech stran, takže se nic neuřízne v mřížce ani ve čtvercových náhledech.
- **Highlighty:** při přidání obalu Instagram nabídne kruhový výřez – nech ho vycentrovaný.

## Nový příspěvek

1. Do `templates/obsah.json` přidej položku, nejjednodušší je zkopírovat existující, třeba `post-vzor`:

   ```json
   {
     "id": "post-04",
     "sablona": "prispevek-text.html",
     "soubor": "post-04-excel.png",
     "w": 1080, "h": 1350,
     "bezpecna": [80, 90, 1000, 1260],
     "nahledy": "mrizka",
     "data": {
       "kicker": "Tip pro firmy",
       "nadpis": "Kdy se vyplatí\n*aplikace místo Excelu?*",
       "text": "Když se v tabulce ztrácí zakázky a stejná data přepisujete na tři místa.",
       "odrazky": ["Víc lidí edituje stejný soubor", "Data se ručně přepisují"],
       "pilulka": "Konzultace zdarma"
     }
   }
   ```

2. Vyrenderuj ho (první řádek jen jednou, nainstaluje Playwright a sharp mimo repozitář):

   ```bash
   npm install --prefix /tmp/wt-render playwright-core sharp
   node social-branding/templates/render.mjs --moduly=/tmp/wt-render/node_modules post-04
   ```

   Spouští se z kořene `webtitan.cz/`. Bez `post-04` se vyrenderuje všechno. Potřebuje Google Chrome
   (jinak použije Chromium z Playwrightu: `npx --prefix /tmp/wt-render playwright install chromium`).
   PNG se uloží do `social-branding/`, náhledy do `social-branding/nahledy/`.

3. Na konci se vypíše tabulka se skutečnými rozměry všech PNG a výsledkem kontroly. Když je někde `CHYBA`, příkaz
   skončí s kódem 1. Kontroluje se:
   - přesný rozměr,
   - že se načetla písma z webu a žádný znak (diakritika, uvozovky, pomlčky) nespadl do náhradního písma,
   - že důležité prvky (`data-dulezite`) leží v bezpečné zóně (`bezpecna`) a nepřekrývají se.

**Ladění v prohlížeči:** `node social-branding/templates/render.mjs --moduly=/tmp/wt-render/node_modules --serve`
a otevři vypsanou adresu, např. `http://127.0.0.1:4410/social-branding/templates/prispevek-text.html?p=post-04`.
Šablona si texty načte z `obsah.json` podle `?p=`, takže po úpravě stačí obnovit stránku.

### Texty

- `*text*` = oranžové zvýraznění, `**text**` = tučně, `\n` = nový řádek.
- Nezlomitelné mezery za jednopísmennými předložkami (v, k, s, z, a, i, o, u), mezi číslem a „Kč“ a v tisících se
  doplní samy.
- Písma obsahují jen znaky češtiny a slovenštiny. Emoji, šipky (→) a podobně se nevykreslí, render na ně upozorní.
  Na šipky a fajfky jsou ikony.

### Šablony

| Šablona | Data |
|---|---|
| `prispevek-text.html` | univerzální: `kicker`, `nadpis`, `text`, `odrazky` [až 4], `misto`, `url`, `pilulka`. Dlouhý nadpis se sám zmenší. |
| `prispevek-sluzby.html` | `kicker`, `nadpis`, `sluzby` [{ `ikona`, `nazev`, `popis` }] (3 nebo 4), `misto`, `url`, `pilulka` |
| `prispevek-ukazka.html` | `kicker`, `nadpis`, `text`, `screenshot`, `screenshotMobil` (`false` = bez telefonu), `adresa`, `stitky` [..], `url`. Bez screenshotu se vykreslí vyznačené místo pro obrázek. |
| `prispevek-predstaveni.html` | `kicker`, `nadpis`, `text`, `polozky` [{ `ikona`, `nazev` }] (4), `misto`, `url`, `pilulka` |
| `reklama.html` | reklama pro Meta Ads, viz [Reklamy](#reklamy-meta-ads): `format` (`feed` / `story`), `kicker`, `nadpis`, `cislo`, `veta`, `screenshot`, `pozice`, `screenshotMobil`, `adresa`, `fakty` [{ `ikona`, `text` }], `pilulka`, `url` |
| `story.html` | vše volitelné: `kicker`, `nadpis`, `text`, `url`, `helma` (`false` = bez helmy) |
| `highlight.html` | `ikona`, `velikost` |
| `cover.html` | `nadpis`, `podnadpis` [části oddělené tečkou] |
| `profil.html` | `velikost`, `posun` |

Ikony (`ikona`): `web`, `aplikace`, `eshop`, `sit`, `sluzby`, `ukazky`, `kontakt`, `recenze`, `misto`, `sipka`, `ok`, `kalendar`, `obrazek`.
Novou ikonu přidej jako `<symbol id="i-nazev" viewBox="0 0 48 48">` do `templates/ikony.svg` (čáry, bez výplně).

Barvy, písma, pozadí, karty a dlaždice ikon jsou v `templates/zaklad.css`, společné rozložení příspěvků
v `templates/prispevek.css`, mockup notebooku a telefonu v `templates/mockup.css` (příspěvek s ukázkou i reklamy),
rozložení reklam v `templates/reklama.css`, vlnité linky (`vlny()`) a kontrola v `templates/zaklad.js`.

## Reklamy (Meta Ads)

Šablona `templates/reklama.html` + `reklama.css`, jedna pro oba formáty (`"format": "feed"` nebo `"story"`). Texty jsou
v `obsah.json` u položek `reklama-*`, kampaň a texty reklam v
[`materialy/propagace/inzeraty/facebook/README.md`](../materialy/propagace/inzeraty/facebook/README.md#kampaň-v-ads-manageru).

- **Obsah:** logo · kicker · nadpis na 2 řádky (`\n`, nadpis se zmenší, aby se každý řádek vešel) · jedna krátká věta ·
  ukázka v notebooku (a telefonu) nebo `fakty` s ikonami · cenová pilulka · webtitan.cz. Textu co nejméně, nadpis musí
  jít přečíst i ve zmenšení na 30 % (`nahledy/reklamy-feed-30pct.png`).
- **Typografická reklama** (bez screenshotu): `"cislo": true` udělá z prvního řádku nadpisu velké číslo
  (`"Až *60 %*\nna aplikaci od kraje"`), místo ukázky se vypíšou `fakty`.
- **Bezpečné zóny** (`bezpecna`): feed `[80, 80, 1000, 1270]` (okraj 80 px), story `[80, 250, 1000, 1580]` – horních
  250 px překrývá profil a průběh, spodních 340 px odpověď a tlačítko CTA. Ve story jsou v té dolní zóně jen vlnité
  linky (`nahledy/reklamy-story-zony-ui.png`).
- **Fakta a ceny** ověřuj proti webu (`web/src/data/sluzby.ts`, stránky služeb). Voucher web nezmiňuje, platí podmínky
  z README kampaně: jen software a jeho zavedení, ne weby a e-shopy.

Render jen reklam: `node social-branding/templates/render.mjs --moduly=/tmp/wt-render/node_modules reklama`.

### Nový screenshot pro ukázku

```bash
node social-branding/templates/screenshot.mjs --moduly=/tmp/wt-render/node_modules https://adresa-projektu.cz/ projekt
```

Uloží `podklady/projekt-desktop.png` (2880×1800) a `podklady/projekt-mobil.png` (1170×2532). V `obsah.json` pak
`"screenshot": "../podklady/projekt-desktop.png"`. Jak vznikl současný screenshot konfigurátoru, je popsané v hlavičce
`screenshot.mjs`. `fitnessural-*.png` jsou z 20. 11. 2026 bez dalších voleb (`https://fitnessural.cz/ fitnessural`).
Screenshot s jiným poměrem než 16:10 se do notebooku ořízne, výřez určuje `"pozice"` (např. `"left top"` u ePodnikám).
