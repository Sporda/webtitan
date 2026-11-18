// Reference: velké karty (Zadání / Řešení / Přínos) a malé náhledy. Jedna reference = jeden záznam;
// stránky si je vybírají podle id (<RefCase id="…" />, <RefThumb id="…" />), takže se úprava propíše všude.
// Texty jsou HTML (&nbsp;). Obrázky jsou v public/assets/projects/.

/** Pro koho jsem projekt vyvíjel (u karty a náhledu se zobrazí „Vyvinuto pro …“ s odkazem). */
export const ZADAVATELE = {
  vujo: { nazev: "VUJO s.r.o.", url: "https://www.vujo.cz/" },
} as const;

export interface Reference {
  id: string;
  /** Soubor v /assets/projects/. */
  obrazek: string;
  /** Vyvinuto pro (agentura), viz ZADAVATELE. */
  pro?: keyof typeof ZADAVATELE;
  /** Úvodní stránka: pro koho se zvýrazní ("app", "web" nebo "app web"). */
  rel?: string;
  /** Velká karta. */
  karta?: { domena: string; alt: string; w: number; h: number; stitek: string; titulek: string; zadani: string; reseni: string; prinos: string; technologie: string };
  /** Malý náhled. */
  nahled?: { alt: string; nazev: string; popis: string };
}

export const REFERENCE: Reference[] = [
  {
    id: "dev-c-r-m",
    obrazek: "DevCRM.webp",
    rel: "app",
    karta: {
      domena: "crm.webtitan.cz",
      alt: "Ukázka aplikace DevCRM – přehled poptávek z webu (ukázková data)",
      w: 800,
      h: 400,
      stitek: "Vlastní aplikace",
      titulek: "DevCRM – práce, docházka, zákazníci a&nbsp;faktury v&nbsp;jedné aplikaci",
      zadani: "Malá firma potřebuje mít zakázky, odpracovaný čas, zákazníky a&nbsp;fakturaci na jednom místě – ne v&nbsp;pěti různých nástrojích.",
      reseni: "Webová aplikace s&nbsp;docházkou a&nbsp;výkazy, projekty a&nbsp;úkoly, zákazníky, fakturací a&nbsp;přehledy. Týmové prostory s&nbsp;rolemi a&nbsp;oprávněními, napojení přes API.",
      prinos: "Používám ji sám: poptávky z&nbsp;tohoto webu v&nbsp;ní přistanou automaticky, i&nbsp;s&nbsp;tím, odkud zákazník přišel.",
      technologie: "SvelteKit · PostgreSQL · API · <a href=\"https://crm.webtitan.cz/\" target=\"_blank\" rel=\"noopener\">crm.webtitan.cz</a>",
    },
  },
  {
    id: "fitness-ural",
    obrazek: "FitnessUral.webp",
    pro: "vujo",
    rel: "web",
    karta: {
      domena: "fitnessural.cz",
      alt: "Úvodní stránka webu Fitness URAL v Sokolově",
      w: 800,
      h: 400,
      stitek: "Web fitness centra · Sokolov",
      titulek: "Fitness URAL – web se skupinovými lekcemi, trenéry a&nbsp;rezervacemi",
      zadani: "Fitness centrum s&nbsp;posilovnou, skupinovými lekcemi, osobními trenéry a&nbsp;dalšími službami potřebuje web, na kterém se člověk rychle zorientuje a&nbsp;dostane se k&nbsp;rezervaci.",
      reseni: "Web na WordPressu s&nbsp;vlastním doplňkem pro skupinové lekce, trenéry, soutěže a&nbsp;galerie. Lekce jsou propojené s&nbsp;trenéry, kteří je vedou, a&nbsp;odkud se dá rovnou rezervovat. Web jsem nově i&nbsp;zabezpečil – ochrana přihlášení, aktualizace a&nbsp;kontrola serveru.",
      prinos: "Lekce, trenéry i&nbsp;soutěže si fitko upravuje samo v&nbsp;administraci – web je sám propojí a&nbsp;z&nbsp;každé lekce je to k&nbsp;trenérovi i&nbsp;k&nbsp;rezervaci na pár kliknutí.",
      technologie: "WordPress · vlastní plugin · napojení na rezervační systém · <a href=\"https://www.fitnessural.cz/\" target=\"_blank\" rel=\"noopener\">fitnessural.cz</a>",
    },
  },
  {
    id: "bmp-konfigurator",
    obrazek: "BmpKonfigurator.webp",
    rel: "app web",
    karta: {
      domena: "konfigurator-bmp.webtitan.cz",
      alt: "Ukázka 3D konfigurátoru kontejnerů pro BMP Bohemia",
      w: 800,
      h: 400,
      stitek: "3D konfigurátor · ukázková verze",
      titulek: "BMP Bohemia – konfigurátor kontejnerů s&nbsp;3D náhledem",
      zadani: "Zákazník si má sám sestavit kontejner na míru a&nbsp;hned vidět, jak bude vypadat a&nbsp;kolik zhruba bude stát.",
      reseni: "Konfigurátor v&nbsp;8 krocích – model, rozměry, konstrukce, vrata, zastřešení, barva, příslušenství a&nbsp;souhrn – s&nbsp;3D modelem, který jde otáčet, průběžnou cenou, uloženými konfiguracemi a&nbsp;poptávkou. Česky i&nbsp;německy.",
      prinos: "Poptávka přijde rovnou s&nbsp;hotovou konfigurací – bez dlouhého zjišťování rozměrů a&nbsp;výbavy.",
      technologie: "three.js (3D) · Astro + Svelte · Laravel · PostgreSQL · <a href=\"https://konfigurator-bmp.webtitan.cz/\" target=\"_blank\" rel=\"noopener\">konfigurator-bmp.webtitan.cz</a>",
    },
  },
  {
    id: "moje-bojovka",
    obrazek: "MojeBojovka.webp",
    rel: "app web",
    karta: {
      domena: "mojevyprava.webtitan.cz",
      alt: "Ukázka webové aplikace Moje bojovka – bojovka na narozeniny na míru dítěte",
      w: 800,
      h: 400,
      stitek: "Vlastní produkt · před spuštěním",
      titulek: "Moje bojovka – bojovka na narozeniny na míru dítěte",
      zadani: "Rodiče chtějí dětem na oslavu připravit hru na hledání pokladu, ale nemají čas ji vymýšlet a&nbsp;chystat.",
      reseni: "Webová aplikace, kde si rodič vybere motiv (piráti, čarodějové, draci, vesmír), zadá jména a&nbsp;věk dětí a&nbsp;místo hry. Po zaplacení dostane personalizovaný PDF balíček s&nbsp;pozvánkami, šiframi, glejty i&nbsp;diplomy.",
      prinos: "Hra je připravená za pár minut a&nbsp;balíček se vyrábí sám – žádná ruční práce s&nbsp;každou objednávkou.",
      technologie: "Astro · Laravel · generování PDF · online platby",
    },
  },
  {
    id: "e-podnikam",
    obrazek: "ePodnikam.webp",
    rel: "app",
    karta: {
      domena: "ePodnikám – zakázky",
      alt: "Ukázka aplikace ePodnikám – přehled zakázek se stavy (ukázková data)",
      w: 800,
      h: 400,
      stitek: "Firemní systém",
      titulek: "ePodnikám – zakázky, faktury, docházka a&nbsp;sklad pro malé firmy",
      zadani: "Malá firma potřebuje mít zakázky, faktury, docházku, vozidla i&nbsp;sklad na jednom místě – bez Excelu a&nbsp;bez drahého podnikového systému.",
      reseni: "Modulární webová aplikace: zakázky se stavy od poptávky po fakturaci, plán práce podle pracovníků, kontakty s&nbsp;načtením údajů z&nbsp;ARES, faktury, docházka, vozový park a&nbsp;sklad. Každý zaměstnanec vidí jen to, co má.",
      prinos: "Majitel má na jednom místě přehled, co se děje, kdo na čem pracuje a&nbsp;co je potřeba vyfakturovat.",
      technologie: "NestJS · React · PostgreSQL · role a oprávnění",
    },
  },
  {
    id: "gprooms",
    obrazek: "Gprooms.webp",
    pro: "vujo",
    rel: "web",
    karta: {
      domena: "GP Rooms – rezervace",
      alt: "Ukázka webu GP Rooms – rezervace ubytování a vstupenek na MotoGP v Brně",
      w: 800,
      h: 400,
      stitek: "Rezervační systém",
      titulek: "GP Rooms – ubytování a&nbsp;vstupenky na MotoGP",
      zadani: "Nabídnout návštěvníkům Velké ceny v&nbsp;Brně ubytování, vstupenky a&nbsp;dopravu na okruh online.",
      reseni: "Rezervační systém pro ubytovací zařízení s&nbsp;online platbami.",
      prinos: "Hosté si vyberou, zarezervují a&nbsp;zaplatí sami – bez dlouhého dopisování e-mailem.",
      technologie: "React · Node.js · platby",
    },
  },
  {
    id: "vb-porcelan",
    obrazek: "VbPorcelan.webp",
    rel: "web",
    karta: {
      domena: "vb-porcelan.webtitan.cz",
      alt: "Ukázka e-shopu Bílé zlato – originální porcelán Villeroy & Boch",
      w: 800,
      h: 400,
      stitek: "Novinka · e-shop · ukázková verze",
      titulek: "Bílé zlato – e-shop s&nbsp;porcelánem Villeroy &amp; Boch",
      zadani: "Prodávat nový originální porcelán Villeroy &amp; Boch pod doporučenou cenou výrobce – v&nbsp;e-shopu, který působí stejně elegantně jako samotné zboží.",
      reseni: "E-shop na míru: katalog podle kategorií a&nbsp;kolekcí, filtry, vyhledávání, oblíbené, košík a&nbsp;objednávka, ke které patří administrace. Design si klient vybral ze šesti návrhů. V&nbsp;ukázkové verzi odejde objednávka jako nezávazná poptávka.",
      prinos: "Zákazník si porcelán projde podle kolekcí a&nbsp;objedná na pár kliknutí – majitel má každou objednávku hned v&nbsp;e-mailu i&nbsp;v&nbsp;administraci.",
      technologie: "Laravel · SQLite · automatické testy · <a href=\"https://vb-porcelan.webtitan.cz/\" target=\"_blank\" rel=\"noopener\">vb-porcelan.webtitan.cz</a>",
    },
  },
  {
    id: "dev-duck",
    obrazek: "DevDuck.webp",
    rel: "web",
    karta: {
      domena: "Dev Duck &amp; crew",
      alt: "Ukázka webu Dev Duck & crew – 3D tištěné postavičky pro programátory",
      w: 800,
      h: 400,
      stitek: "Web vlastní značky",
      titulek: "Dev Duck &amp; crew – web pro 3D tištěné postavičky",
      zadani: "Ověřit zájem o&nbsp;novou značku designových postaviček pro lidi z&nbsp;IT ještě před výrobou první série.",
      reseni: "Výrazný web s&nbsp;představením postaviček, fotkami prvních prototypů z&nbsp;tiskárny, výběrem favorita a&nbsp;čekací listinou se slevou pro první zájemce.",
      prinos: "Zájem se dá změřit dřív, než se zaplatí výroba – podle přihlášek se rozhodne, která postavička půjde do tisku první.",
      technologie: "JavaScript · PHP · čekací listina",
    },
    nahled: {
      alt: "Web Dev Duck & crew – 3D tištěné postavičky pro programátory",
      nazev: "Dev Duck &amp; crew",
      popis: "web vlastní značky",
    },
  },
  {
    id: "skripta-prokop",
    obrazek: "SkriptaProkop.webp",
    pro: "vujo",
    rel: "app web",
    karta: {
      domena: "Skripta Prokop",
      alt: "Ukázka webu Skripta Prokop – středoškolská skripta",
      w: 800,
      h: 400,
      stitek: "E-learning s&nbsp;prodejem",
      titulek: "Skripta Prokop – prodej studijních materiálů online",
      zadani: "Autor středoškolských skript chtěl své materiály nabízet a&nbsp;prodávat online.",
      reseni: "E-learningová platforma s&nbsp;katalogem skript, uživatelskými účty a&nbsp;online platbami.",
      prinos: "Objednávky, platby a&nbsp;přístup k&nbsp;materiálům řeší web sám – bez ručního vyřizování.",
      technologie: "Platby · uživatelské účty · e-learning",
    },
    nahled: {
      alt: "Web Skripta Prokop – prodej studijních materiálů online",
      nazev: "Skripta Prokop",
      popis: "e-learning s&nbsp;platbami",
    },
  },
  {
    id: "penzion-loket",
    obrazek: "PenzionLoket.webp",
    pro: "vujo",
    rel: "web",
    nahled: {
      alt: "Web Penzion Ve Skále – ubytování pod hradem Loket",
      nazev: "Penzion Loket",
      popis: "web s&nbsp;rezervacemi",
    },
  },
  {
    id: "kotelna55",
    obrazek: "Kotelna55.webp",
    pro: "vujo",
    rel: "web",
    nahled: {
      alt: "Web Kotelna 55 – uskupení marketingových agentur",
      nazev: "Kotelna 55",
      popis: "web kreativních agentur",
    },
  },
  {
    id: "g-ptents",
    obrazek: "GPtents.webp",
    pro: "vujo",
    rel: "web",
    nahled: {
      alt: "E-shop GP Tents",
      nazev: "GP Tents",
      popis: "e-shop",
    },
  },
  {
    id: "rybar-transport",
    obrazek: "RybarTransport.webp",
    pro: "vujo",
    rel: "web",
    nahled: {
      alt: "Web autodopravy Rybar Transport",
      nazev: "Rybar Transport",
      popis: "web autodopravy",
    },
  },
  {
    id: "firemni-balicek",
    obrazek: "FiremniBalicek.webp",
    pro: "vujo",
    rel: "web",
    nahled: {
      alt: "E-shop Firemní balíček – dárkové balíčky pro firmy",
      nazev: "Firemní balíček",
      popis: "e-shop s&nbsp;dárky",
    },
  },
  {
    id: "hostel-loket",
    obrazek: "HostelLoket.webp",
    pro: "vujo",
    rel: "web",
    nahled: {
      alt: "Web Hostel Loket",
      nazev: "Hostel Loket",
      popis: "web s&nbsp;rezervacemi",
    },
  },
  {
    id: "vyroba-sperku",
    obrazek: "VyrobaSperku.webp",
    pro: "vujo",
    nahled: {
      alt: "E-shop Výroba šperků",
      nazev: "Výroba šperků",
      popis: "e-shop a&nbsp;prezentace",
    },
  },
];

export const reference = (id: string): Reference => {
  const r = REFERENCE.find((x) => x.id === id);
  if (!r) throw new Error(`Neznámá reference: ${id}`);
  return r;
};
