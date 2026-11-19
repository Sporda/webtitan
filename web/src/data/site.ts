// Společné údaje webu – mění se tady a propíšou se do všech stránek.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { publicDir } from "astro:config/server";

export const SITE_URL = "https://webtitan.cz";

/** Obsah souboru ze složky public (cesta od kořene webu, např. "/assets/lead.js") – čte se při buildu. */
export const publicFile = (path: string): Buffer => readFileSync(new URL(`.${path}`, publicDir));

/** Adresa souboru z /public s otiskem obsahu („/assets/lead.js?v=1a2b3c4d“). Otisk se při buildu spočítá
 *  ze souboru, takže po každé jeho změně si prohlížeče samy stáhnou novou verzi – nic se nezvedá ručně. */
export function asset(path: string): string {
  return `${path}?v=${createHash("sha1").update(publicFile(path)).digest("hex").slice(0, 8)}`;
}

/** Volná kapacita – např. "Volno na nové projekty od ledna 2027" (štítek v úvodu a u kontaktu na úvodní stránce).
 *  Prázdné = štítek se nevypíše. */
export const VOLNA_KAPACITA = "";

export const PHONE = "+420723793510";
/** Telefon do textu (HTML, nezlomitelné mezery). */
export const PHONE_SHORT = "723&nbsp;793&nbsp;510";
export const PHONE_LONG = "+420&nbsp;723&nbsp;793&nbsp;510";
export const EMAIL = "jan@webtitan.cz";
export const LINKEDIN = "https://www.linkedin.com/in/jan-%C5%A1porek-07a39168/";
export const GITHUB = "https://github.com/jansporek";
export const LEGAL =
  "Jan Šporek · IČO&nbsp;74792148 · sídlo Dlouhá&nbsp;705/38, 357&nbsp;31 Horní Slavkov · fyzická osoba zapsaná v&nbsp;živnostenském rejstříku · nejsem plátce DPH";

export const OG_IMAGE = `${SITE_URL}/assets/og.jpg`;
