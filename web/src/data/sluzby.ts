// Služby: název, krátký popis a cena se odtud propíšou do patičky, karet „Další služby“ a „Mohlo by vás zajímat“,
// stránek služeb, úvodní stránky, častých otázek, článků, kalkulačky a strukturovaných dat – cena se mění jen tady (od).
// Texty jsou HTML (nezlomitelné mezery &nbsp; za předložkami a v cenách).
import { plain } from "../lib/text";

export type SluzbaId = "app" | "mob" | "web" | "shop" | "srv" | "it";

interface SluzbaData {
  id: SluzbaId;
  url: string;
  nazev: string;
  /** Jedna věta do karty služby. */
  kratce: string;
  /** Nejnižší cena v Kč (bez ní „cena podle rozsahu“); mesicne = paušál za měsíc. */
  od?: number;
  mesicne?: boolean;
  /** Vnitřek ikony (SVG 24×24) do karty služby. */
  ikona: string;
}

export interface Sluzba extends SluzbaData {
  /** Cena do karty služby („od 24&nbsp;950&nbsp;Kč“, „od 990&nbsp;Kč/měsíc“, „cena podle rozsahu“). */
  cena: string;
}

/** Částka do HTML: 24950 → „24&nbsp;950&nbsp;Kč“. */
export const kc = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "&nbsp;") + "&nbsp;Kč";

const DATA: SluzbaData[] = [
  {
    id: "app",
    url: "/vyvoj-aplikaci-na-miru/",
    nazev: "Vývoj aplikací na míru",
    kratce: "Webové aplikace a&nbsp;interní systémy místo Excelu.",
    od: 24950,
    ikona: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 17.5h7M17.5 14v7"/>',
  },
  {
    id: "mob",
    url: "/mobilni-aplikace/",
    nazev: "Mobilní aplikace",
    kratce: "Pro iOS i&nbsp;Android, napojené na váš systém.",
    ikona: '<rect x="6.5" y="2" width="11" height="20" rx="2.5"/><path d="M11 18h2"/>',
  },
  {
    id: "web",
    url: "/tvorba-webu/",
    nazev: "Tvorba webových stránek",
    kratce: "Firemní web, který přivádí poptávky.",
    od: 9970,
    ikona: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  },
  {
    id: "shop",
    url: "/tvorba-e-shopu/",
    nazev: "Tvorba e-shopu",
    kratce: "Platby, doprava a&nbsp;přehledné objednávky.",
    od: 19870,
    ikona: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
  },
  {
    id: "srv",
    url: "/sprava-serveru/",
    nazev: "Správa serverů a&nbsp;webů",
    kratce: "Aktualizace, zálohy a&nbsp;dohled.",
    od: 990,
    mesicne: true,
    ikona: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  },
  {
    id: "it",
    url: "/sprava-it-a-siti/",
    nazev: "Správa IT a&nbsp;sítí",
    kratce: "Síť, Wi-Fi, počítače a&nbsp;zálohy pro malé firmy.",
    od: 1490,
    mesicne: true,
    ikona: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><path d="M12 19.5h.01"/>',
  },
];

export const SLUZBY: Sluzba[] = DATA.map((s) => ({
  ...s,
  cena: s.od ? `od ${kc(s.od)}${s.mesicne ? "/měsíc" : ""}` : "cena podle rozsahu",
}));

export const sluzba = (id: SluzbaId): Sluzba => {
  const s = SLUZBY.find((x) => x.id === id);
  if (!s) throw new Error(`Neznámá služba: ${id}`);
  return s;
};

/** Nejnižší cena služby do HTML bez „od“ a bez „/měsíc“ („24&nbsp;950&nbsp;Kč“) – do textů jako „od … měsíčně“. */
export const castka = (id: SluzbaId): string => {
  const od = sluzba(id).od;
  if (!od) throw new Error(`Služba ${id} nemá cenu`);
  return kc(od);
};
/** Totéž jako prostý text („24 950 Kč“) – do meta značek, strukturovaných dat a řetězců. */
export const castkaText = (id: SluzbaId): string => plain(castka(id));
