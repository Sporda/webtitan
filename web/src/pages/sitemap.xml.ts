// sitemap.xml se skládá při buildu ze stránek v src/pages – nová stránka nebo článek se do ní dostane sám.
// lastmod jen u článků (datum vydání, případně „upraveno“ z data/clanky.ts); u ostatních stránek by ručně psané
// datum rychle zastaralo a vyhledávače nepřesnému lastmod přestanou věřit.
import { SITE_URL } from "../data/site";
import { CLANKY } from "../data/clanky";

const pages = Object.keys(import.meta.glob("./**/*.astro"))
  .filter((f) => f !== "./404.astro")
  .map((f) => "/" + f.slice(2).replace(/index\.astro$/, "").replace(/\.astro$/, ".html"));

// Každý článek z clanky.ts musí mít stránku – jinak by rozcestník a „Mohlo by vás zajímat“ vedly na 404.
for (const c of CLANKY) {
  if (!pages.includes(`/clanky/${c.slug}/`)) throw new Error(`Článek „${c.slug}“ je v data/clanky.ts, ale chybí src/pages/clanky/${c.slug}/index.astro`);
}

function entry(path: string): string {
  const article = CLANKY.find((c) => `/clanky/${c.slug}/` === path);
  const [changefreq, priority] =
    path === "/" ? ["monthly", "1.0"]
    : path === "/ochrana-osobnich-udaju.html" ? ["yearly", "0.3"]
    : path.startsWith("/clanky/") ? ["monthly", "0.6"]
    : ["monthly", "0.8"];
  const lastmod = article ? `\n    <lastmod>${article.upraveno ?? article.datum}</lastmod>` : "";
  return `  <url>\n    <loc>${SITE_URL}${path}</loc>${lastmod}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.sort().map(entry).join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
