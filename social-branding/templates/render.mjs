// Vyrenderuje výstupy z obsah.json do PNG ve složce social-branding/, udělá náhledy ořezu (nahledy/)
// a zkontroluje rozměry, bezpečné zóny, písma a diakritiku.
//
// Potřebuje playwright-core a sharp (nejsou v repozitáři) a Google Chrome (nebo Chromium z Playwrightu):
//   npm install --prefix /tmp/wt-render playwright-core sharp
//   node social-branding/templates/render.mjs --moduly=/tmp/wt-render/node_modules            # všechno
//   node social-branding/templates/render.mjs --moduly=/tmp/wt-render/node_modules post-04    # jen vybrané id
//   node social-branding/templates/render.mjs --moduly=/tmp/wt-render/node_modules --serve    # náhled v prohlížeči
import http from "node:http";
import { readFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const SABLONY = path.dirname(fileURLToPath(import.meta.url));
const VYSTUP = path.resolve(SABLONY, "..");                 // social-branding/
const PROJEKT = path.resolve(VYSTUP, "..");                 // webtitan.cz/ (písma z web/public/assets/fonts)
const NAHLEDY = path.join(VYSTUP, "nahledy");

const argumenty = process.argv.slice(2);
const volba = (k) => argumenty.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
const moduly = volba("moduly") ? path.resolve(volba("moduly"), "..") : SABLONY;
const require = createRequire(path.join(moduly, "x.js"));
const nactiModul = (...jmena) => { for (const j of jmena) { try { return require(j); } catch {} } throw new Error(`Chybí ${jmena.join(" nebo ")} – viz README.`); };
const { chromium } = nactiModul("playwright-core", "playwright");
const sharp = nactiModul("sharp");
const filtr = argumenty.filter((a) => !a.startsWith("--"));

// Šablony potřebují http (fetch helmy, ikon a obsah.json). Server pustí jen social-branding/ a písma webu.
const TYPY = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };
const POVOLENO = [VYSTUP, path.join(PROJEKT, "web/public/assets/fonts")];
const server = http.createServer(async (req, res) => {
  const soubor = path.join(PROJEKT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!POVOLENO.some((p) => soubor.startsWith(p + path.sep))) return res.writeHead(403).end();
  try {
    res.writeHead(200, { "content-type": TYPY[path.extname(soubor)] ?? "application/octet-stream", "cache-control": "no-store" }).end(await readFile(soubor));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(argumenty.includes("--serve") ? 4410 : 0, "127.0.0.1", r));
const ZAKLAD = `http://127.0.0.1:${server.address().port}/social-branding/templates`;

const obsah = JSON.parse(await readFile(path.join(SABLONY, "obsah.json"), "utf8"));


async function spustProhlizec() {
  const args = ["--font-render-hinting=none"];
  try { return await chromium.launch({ channel: "chrome", args }); } catch { return chromium.launch({ args }); }
}

async function render() {
  const vybrane = obsah.vystupy.filter((v) => !filtr.length || filtr.some((f) => v.id.includes(f) || v.soubor.includes(f)));
  if (!vybrane.length) throw new Error(`Nic neodpovídá: ${filtr.join(", ")}`);
  const prohlizec = await spustProhlizec();
  const vysledky = [];
  try {
    for (const v of vybrane) {
      const dpr = v.dpr ?? 2;
      const stranka = await prohlizec.newPage({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: dpr });
      const chybyStranky = [];
      stranka.on("pageerror", (e) => chybyStranky.push(e.message));
      stranka.on("requestfailed", (r) => chybyStranky.push(`nenačteno ${r.url()}`));
      stranka.on("response", (r) => r.status() >= 400 && chybyStranky.push(`${r.status()} ${r.url()}`));
      await stranka.addInitScript((data) => { window.DATA = data; }, v.data ?? {});
      await stranka.goto(`${ZAKLAD}/${v.sablona}`, { waitUntil: "networkidle" });
      await stranka.waitForFunction(() => window.pripraveno, null, { timeout: 15000 });
      const info = await stranka.evaluate(() => window.pripraveno);
      const snimek = await stranka.screenshot({ type: "png" });
      await stranka.close();

      const cil = path.join(VYSTUP, v.soubor);
      await mkdir(path.dirname(cil), { recursive: true });
      await sharp(snimek).resize(v.w, v.h, { kernel: "lanczos3", fit: "fill" }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(cil);
      vysledky.push({ ...kontrola(v, info, chybyStranky), soubor: v.soubor });
    }
    await nahledy();
  } finally {
    await prohlizec.close();
    server.close();
  }

  // Výpis: rozměry všech PNG přečtené ze souborů (výstupy i náhledy).
  const tabulka = [];
  for (const r of vysledky) tabulka.push(await radek(path.join(VYSTUP, r.soubor), r.kontrola));
  for (const n of hotoveNahledy) tabulka.push(await radek(n.cesta, n.kontrola));
  console.table(tabulka);
  if (tabulka.some((r) => r.kontrola !== "OK")) process.exitCode = 1;
}

async function radek(cesta, kontrola) {
  const m = await sharp(cesta).metadata();
  return { soubor: path.relative(VYSTUP, cesta), rozmer: `${m.width}×${m.height}`, velikost: `${((await stat(cesta)).size / 1024).toFixed(0)} kB`, kontrola };
}

// Kontrola jednoho výstupu: písma, znaky mimo písma, chybějící obrázky a důležité prvky v bezpečné zóně.
function kontrola(v, info, chybyStranky) {
  const chyby = [...chybyStranky];
  if (info.nenactene.length) chyby.push(`nenačtené písmo: ${info.nenactene.join(", ")}`);
  if (info.prekryvy.length) chyby.push(`překryv: ${info.prekryvy.join(", ")}`);
  if (info.mimo.length) chyby.push(`znaky mimo písmo: ${info.mimo.join(" ")}`);
  if (info.chybiObrazky.length) chyby.push(`chybí obrázek: ${info.chybiObrazky.join(", ")}`);
  const z = v.bezpecna;
  for (const r of info.dulezite) {
    if (!z) break;
    if (z === "kruh") {
      // Všechny 4 rohy obdélníku prvku musí být v kruhu ořezu (průměr = kratší strana) s rezervou 8 %.
      const cx = v.w / 2, cy = v.h / 2, max = (Math.min(v.w, v.h) / 2) * 0.92;
      const rohy = [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]];
      const nejdal = Math.max(...rohy.map(([x, y]) => Math.hypot(x - cx, y - cy)));
      if (nejdal > max) chyby.push(`${r.co} mimo kruh (${nejdal.toFixed(0)} > ${max.toFixed(0)} px)`);
    } else {
      const [x0, y0, x1, y1] = z;
      if (r.x < x0 - 0.5 || r.y < y0 - 0.5 || r.x + r.w > x1 + 0.5 || r.y + r.h > y1 + 0.5) {
        chyby.push(`${r.co} mimo bezpečnou zónu [${z}]: x ${r.x.toFixed(0)}–${(r.x + r.w).toFixed(0)}, y ${r.y.toFixed(0)}–${(r.y + r.h).toFixed(0)}`);
      }
    }
  }
  return { kontrola: chyby.length ? `CHYBA: ${chyby.join("; ")}` : "OK" };
}

// ---------- náhledy ----------
const hotoveNahledy = [];
const ulozNahled = async (soubor, obraz, kontrolaRozmeru) => {
  const cesta = path.join(NAHLEDY, soubor);
  await mkdir(NAHLEDY, { recursive: true });
  await obraz.png({ compressionLevel: 9 }).toFile(cesta);
  const m = await sharp(cesta).metadata();
  const ok = !kontrolaRozmeru || (m.width === kontrolaRozmeru[0] && m.height === kontrolaRozmeru[1]);
  hotoveNahledy.push({ cesta, kontrola: ok ? "OK" : `CHYBA: rozměr ${m.width}×${m.height}` });
};
const kruhovaMaska = (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 2}"/></svg>`);

// Náhledy se dělají vždy ze všech hotových PNG v obsah.json (i když se renderoval jen jeden výstup).
async function nahledy() {
  const existuje = (f) => stat(f).then(() => true, () => false);
  const najdi = async (typ) => {
    const cesty = obsah.vystupy.filter((v) => v.nahledy === typ).map((v) => path.join(VYSTUP, v.soubor));
    const ok = await Promise.all(cesty.map(existuje));
    return cesty.filter((_, i) => ok[i]);
  };

  // Profilová fotka: kruhový ořez (průhledné rohy) – přesně to, co ukáže Facebook i Instagram.
  for (const f of (await najdi("profil"))) {
    const m = await sharp(f).metadata();
    await ulozNahled("profile-preview-circle.png",
      sharp(f).ensureAlpha().composite([{ input: kruhovaMaska(m.width, m.height), blend: "dest-in" }]), [m.width, m.height]);
  }

  // Titulní fotka: desktop 851×315 (přizpůsobení na šířku, ořez nahoře/dole), mobil 640×360 (na výšku, ořez boků).
  for (const f of (await najdi("cover"))) {
    await ulozNahled("fb-cover-preview-desktop-851x315.png", sharp(f).resize(851, 315, { fit: "cover", position: "centre", kernel: "lanczos3" }), [851, 315]);
    await ulozNahled("fb-cover-preview-mobile-640x360.png", sharp(f).resize(640, 360, { fit: "cover", position: "centre", kernel: "lanczos3" }), [640, 360]);
  }

  // Příspěvky: mřížka profilu Instagramu (výřez 3:4 ze středu), 3 vedle sebe jako na profilu.
  const posty = (await najdi("mrizka"));
  if (posty.length) {
    const sl = 360, vy = 480, mezera = 6;   // 3:4
    const dlazdice = await Promise.all(posty.slice(0, 9).map((f) => sharp(f).resize(sl, vy, { fit: "cover", position: "centre", kernel: "lanczos3" }).png().toBuffer()));
    const radky = Math.ceil(dlazdice.length / 3);
    const w = sl * 3 + mezera * 2, h = vy * radky + mezera * (radky - 1);
    await ulozNahled("ig-grid-preview.png", sharp({ create: { width: w, height: h, channels: 4, background: "#ffffff" } })
      .composite(dlazdice.map((input, i) => ({ input, left: (i % 3) * (sl + mezera), top: Math.floor(i / 3) * (vy + mezera) }))), [w, h]);
  }

  // Reklamy ve feedu: všechny vedle sebe zmenšené na 30 % (324×405) – kontrola čitelnosti nadpisu v malém náhledu.
  const feedy = await najdi("reklama-feed");
  if (feedy.length) {
    const sl = 324, vy = 405, m = 24;
    const dl = await Promise.all(feedy.map((f) => sharp(f).resize(sl, vy, { kernel: "lanczos3" }).png().toBuffer()));
    const w = dl.length * sl + (dl.length + 1) * m, h = vy + m * 2;
    await ulozNahled("reklamy-feed-30pct.png", sharp({ create: { width: w, height: h, channels: 4, background: "#f0f2f5" } })
      .composite(dl.map((input, i) => ({ input, left: m + i * (sl + m), top: m }))), [w, h]);
  }

  // Reklamy ve story: 30 % (324×576) s vyznačenými zónami rozhraní – nahoře 250 px (průběh, profil, zavřít),
  // dole 340 px (odpověď, tlačítko CTA). Do červených pásů nesmí zasahovat nic důležitého.
  const stories = await najdi("reklama-story");
  if (stories.length) {
    const k = 0.3, [sl, vy, nahore, dole] = [1080, 1920, 250, 340].map((v) => Math.round(v * k)), m = 24;
    const ui = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sl}" height="${vy}">
      <rect width="${sl}" height="${nahore}" fill="rgba(255,40,80,.32)"/>
      <rect y="${vy - dole}" width="${sl}" height="${dole}" fill="rgba(255,40,80,.32)"/>
      <rect x="8" y="8" width="${sl - 16}" height="3" rx="1.5" fill="#fff" opacity=".85"/>
      <circle cx="24" cy="32" r="11" fill="#fff" opacity=".9"/>
      <rect x="42" y="27" width="96" height="10" rx="5" fill="#fff" opacity=".85"/>
      <rect x="${sl - 30}" y="26" width="14" height="12" rx="2" fill="#fff" opacity=".85"/>
      <rect x="40" y="${vy - 78}" width="${sl - 80}" height="34" rx="17" fill="#fff" opacity=".95"/>
      <rect x="16" y="${vy - 32}" width="${sl - 32}" height="22" rx="11" fill="none" stroke="#fff" stroke-width="1.5" opacity=".8"/>
    </svg>`);
    const dl = await Promise.all(stories.map((f) => sharp(f).resize(sl, vy, { kernel: "lanczos3" }).composite([{ input: ui }]).png().toBuffer()));
    const w = dl.length * sl + (dl.length + 1) * m, h = vy + m * 2;
    await ulozNahled("reklamy-story-zony-ui.png", sharp({ create: { width: w, height: h, channels: 4, background: "#f0f2f5" } })
      .composite(dl.map((input, i) => ({ input, left: m + i * (sl + m), top: m }))), [w, h]);
  }

  // Zvýrazněné příběhy: kruhový výřez ze středu, jak je ukáže Instagram pod profilem.
  const hl = (await najdi("highlight"));
  if (hl.length) {
    const d = 220, mezera = 40;
    const kruhy = await Promise.all(hl.map(async (f) => {
      const m = await sharp(f).metadata();
      const s = Math.min(m.width, m.height);
      return sharp(f).extract({ left: Math.round((m.width - s) / 2), top: Math.round((m.height - s) / 2), width: s, height: s })
        .resize(d, d, { kernel: "lanczos3" }).ensureAlpha()
        .composite([{ input: kruhovaMaska(d, d), blend: "dest-in" }]).png().toBuffer();
    }));
    const w = kruhy.length * d + (kruhy.length + 1) * mezera, h = d + mezera * 2;
    await ulozNahled("highlights-preview.png", sharp({ create: { width: w, height: h, channels: 4, background: "#ffffff" } })
      .composite(kruhy.map((input, i) => ({ input, left: mezera + i * (d + mezera), top: mezera }))), [w, h]);
  }
}

// ---------- spuštění (na konci, až jsou definované všechny funkce a konstanty) ----------
if (argumenty.includes("--serve")) {
  console.log(`Náhled šablon: ${ZAKLAD}/<sablona>.html?p=<id>, např.`);
  for (const v of obsah.vystupy) console.log(`  ${ZAKLAD}/${v.sablona}?p=${v.id}   (${v.w}×${v.h})`);
  console.log("Ukončení: Ctrl+C");
} else {
  await render();
}
