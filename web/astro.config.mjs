// webtitan.cz – statický web v Astru.
// Výstup je čisté HTML jako dřív (žádný framework ani JS navíc v prohlížeči): CSS i skripty stránek zůstávají
// vložené přímo ve stránce (is:inline), takže se nepřidává žádný požadavek. Astro tu slouží jen ke skládání
// stránek z komponent a dat (src/components, src/data), aby se společné části měnily na jednom místě.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://webtitan.cz", // stejná adresa jako SITE_URL v src/data/site.ts
  // preserve: src/pages/tvorba-webu/index.astro → tvorba-webu/index.html, ochrana-osobnich-udaju.astro →
  // ochrana-osobnich-udaju.html, 404.astro → 404.html – stejné adresy jako dřív.
  build: { format: "preserve" },
  // true = jen sbalí opakované mezery. Výchozí hodnota v Astru 7 je "jsx", která mezery mezi prvky úplně maže
  // (slepí text, tlačítka a odkazy) – proto zůstává nastavené výslovně.
  compressHTML: true,
  devToolbar: { enabled: false },
});
