// Převod HTML textu z dat (s &nbsp;, <strong>…) na prostý text pro meta značky a strukturovaná data.

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** Prostý text z HTML: bez značek, entity rozbalené, nezlomitelné mezery jako obyčejné. */
export function plain(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/ /g, " ");
}

const MESICE = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];

/** "2026-11-14" → "14. listopadu 2026" */
export function datumCesky(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}. ${MESICE[m - 1]} ${y}`;
}
