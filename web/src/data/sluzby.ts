// Služby: název, krátký popis a cena se odtud propíšou do patičky, karet „Další služby“ a „Mohlo by vás zajímat“.
// Texty jsou HTML (nezlomitelné mezery &nbsp; za předložkami a v cenách).

export type SluzbaId = "app" | "mob" | "web" | "shop" | "srv" | "it";

export interface Sluzba {
  id: SluzbaId;
  url: string;
  nazev: string;
  /** Jedna věta do karty služby. */
  kratce: string;
  /** Cena do karty služby. */
  cena: string;
  /** Vnitřek ikony (SVG 24×24) do karty služby. */
  ikona: string;
}

export const SLUZBY: Sluzba[] = [
  {
    id: "app",
    url: "/vyvoj-aplikaci-na-miru/",
    nazev: "Vývoj aplikací na míru",
    kratce: "Webové aplikace a&nbsp;interní systémy místo Excelu.",
    cena: "od 24&nbsp;950&nbsp;Kč",
    ikona: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 17.5h7M17.5 14v7"/>',
  },
  {
    id: "mob",
    url: "/mobilni-aplikace/",
    nazev: "Mobilní aplikace",
    kratce: "Pro iOS i&nbsp;Android, napojené na váš systém.",
    cena: "cena podle rozsahu",
    ikona: '<rect x="6.5" y="2" width="11" height="20" rx="2.5"/><path d="M11 18h2"/>',
  },
  {
    id: "web",
    url: "/tvorba-webu/",
    nazev: "Tvorba webových stránek",
    kratce: "Firemní web, který přivádí poptávky.",
    cena: "od 9&nbsp;970&nbsp;Kč",
    ikona: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  },
  {
    id: "shop",
    url: "/tvorba-e-shopu/",
    nazev: "Tvorba e-shopu",
    kratce: "Platby, doprava a&nbsp;přehledné objednávky.",
    cena: "od 19&nbsp;870&nbsp;Kč",
    ikona: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
  },
  {
    id: "srv",
    url: "/sprava-serveru/",
    nazev: "Správa serverů a&nbsp;webů",
    kratce: "Aktualizace, zálohy a&nbsp;dohled.",
    cena: "od 990&nbsp;Kč/měsíc",
    ikona: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  },
  {
    id: "it",
    url: "/sprava-it-a-siti/",
    nazev: "Správa IT a&nbsp;sítí",
    kratce: "Síť, Wi-Fi, počítače a&nbsp;zálohy pro malé firmy.",
    cena: "od 1&nbsp;490&nbsp;Kč/měsíc",
    ikona: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><path d="M12 19.5h.01"/>',
  },
];

export const sluzba = (id: SluzbaId): Sluzba => {
  const s = SLUZBY.find((x) => x.id === id);
  if (!s) throw new Error(`Neznámá služba: ${id}`);
  return s;
};
