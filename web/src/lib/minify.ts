// Zmenšení CSS a JS, které se vkládají přímo do stránky – při buildu, bez komentářů a zbytečných mezer.
// (Astro je přes ?raw + set:html nijak nezpracovává.) Zdrojové soubory v src/styles a src/scripts zůstávají čitelné.
import { minifySync } from "rolldown/utils";

/** CSS: jen komentáře a mezery – vlastnosti ani hodnoty se nemění. (Optimalizující minifikátory, např. lightningcss
 *  bez nastavených prohlížečů, umí slít backdrop-filter a -webkit-backdrop-filter do jednoho a rozbít tak vzhled.)
 *  Předpoklad: řetězce v CSS (content: "…") neobsahují víc mezer za sebou ani „/*“. */
export function minCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

export function minJs(js: string, name = "page.js"): string {
  const r = minifySync(name, js);
  if (r.errors.length) throw new Error(`minJs ${name}: ${r.errors.map((e) => e.message).join("; ")}`);
  return r.code;
}
