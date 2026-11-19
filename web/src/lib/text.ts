// Převod HTML textu z dat (s &nbsp;, <strong>…) na prostý text pro meta značky a strukturovaná data.

const ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  ndash: "–", mdash: "—", hellip: "…", minus: "−", times: "×", middot: "·", deg: "°", copy: "©", euro: "€",
  bdquo: "„", ldquo: "“", rdquo: "”", sbquo: "‚", lsquo: "‘", rsquo: "’", laquo: "«", raquo: "»",
  thinsp: " ", shy: "",
};

/** Znak pro entitu (bez & a ;), nebo undefined, když ji neznáme nebo číslo není platný znak. */
function entity(e: string): string | undefined {
  if (e[0] !== "#") return ENTITIES[e.toLowerCase()];
  const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
  return n > 0 && n <= 0x10ffff && (n < 0xd800 || n > 0xdfff) ? String.fromCodePoint(n) : undefined;
}

/** Prostý text z HTML: bez značek, entity rozbalené, nezlomitelné mezery jako obyčejné.
 *  Neznámá entita zůstane, jak je. */
export function plain(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) => entity(e) ?? m)
    .replace(/ /g, " ");
}

const MESICE = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];

/** "2026-11-14" → "14. listopadu 2026" */
export function datumCesky(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}. ${MESICE[m - 1]} ${y}`;
}
