// Screenshot webu do podkladů pro šablonu ukázky (prispevek-ukazka.html): desktop 2880×1800 (1440×900 @2×)
// a mobil 1170×2532 (390×844 @3×). Uloží do social-branding/podklady/<nazev>-desktop.png a <nazev>-mobil.png.
//
//   node social-branding/templates/screenshot.mjs --moduly=/tmp/wt-render/node_modules https://konfigurator-bmp.webtitan.cz/ konfigurator
//
// Volby:
//   --cekat=5000          ms na dokreslení (3D scéna, animace), výchozí 4000
//   --skryt=".a,.b"       CSS selektory, které se schovají (cookie lišta, chat …)
//   --ls=KLÍČ=soubor.json obsah localStorage před načtením (např. předvyplněná konfigurace)
//
// Současné podklady/konfigurator-*.png: statická verze konfigurátoru z repozitáře BMP-konfigurator (index.html,
// stejná 3D scéna jako ostrá verze), krok 06 Barva, RAL 2004, prostředí Showroom:
//   --ls='bmp-konfigurator-v1=konfigurace.json' --skryt="#notesBtn,#saveBtn,#saved,.toast" --cekat=5000
//   konfigurace.json: {"cat":"abroll","bg":"show","step":5,"lang":"cs","seen":{"abroll":[0,1,2,3,4,5,6]},"cfg":{"abroll":{"color":"2004"}}}
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const VYSTUP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../podklady");
const args = process.argv.slice(2);
const volba = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
const [url, nazev = "screenshot"] = args.filter((a) => !a.startsWith("--"));
if (!url) throw new Error("Použití: screenshot.mjs [--moduly=…] <url> <nazev>");
const require = createRequire(path.join(volba("moduly") ? path.resolve(volba("moduly"), "..") : VYSTUP, "x.js"));
let chromium;
for (const j of ["playwright-core", "playwright"]) { try { ({ chromium } = require(j)); break; } catch {} }

let ls = null;
if (volba("ls")) {
  const [klic, soubor] = volba("ls").split("=");
  ls = { klic, hodnota: await readFile(soubor, "utf8") };
}
// WebGL (3D) potřebuje v headless režimu softwarové vykreslování.
const args3d = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const prohlizec = await chromium.launch({ channel: "chrome", args: args3d }).catch(() => chromium.launch({ args: args3d }));
await mkdir(VYSTUP, { recursive: true });
for (const [druh, w, h, dpr, mobil] of [["desktop", 1440, 900, 2, false], ["mobil", 390, 844, 3, true]]) {
  const p = await prohlizec.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobil, hasTouch: mobil });
  if (ls) await p.addInitScript(({ klic, hodnota }) => localStorage.setItem(klic, hodnota), ls);
  await p.goto(url, { waitUntil: "networkidle" });
  if (volba("skryt")) await p.addStyleTag({ content: `${volba("skryt")}{display:none!important}` });
  await p.waitForTimeout(Number(volba("cekat") ?? 4000));
  const cil = path.join(VYSTUP, `${nazev}-${druh}.png`);
  await p.screenshot({ path: cil });
  console.log(`${cil}  ${w * dpr}×${h * dpr}`);
  await p.close();
}
await prohlizec.close();
