// Články: údaje pro stránku článku (src/pages/clanky/<slug>/index.astro), rozcestník /clanky/ a karty
// „Mohlo by vás zajímat“. Pořadí = pořadí v rozcestníku (nejnovější nahoře). Texty jsou HTML (&nbsp;).
import type { SluzbaId } from "./sluzby";

export interface Clanek {
  slug: string;
  /** Kategorie (nadpisek nad nadpisem a na kartě). */
  kategorie: string;
  /** Kratší kategorie na kartu, když se liší od nadpisku. */
  stitek?: string;
  /** Nadpis článku (h1, karta, headline). */
  titulek: string;
  /** Krátký název do drobečkové navigace. */
  nazev: string;
  /** Popis: karta článku, meta description, strukturovaná data. */
  popis: string;
  /** Úvodní odstavec v hlavičce článku. */
  perex: string;
  /** Datum vydání (RRRR-MM-DD). */
  datum: string;
  /** Doba čtení v minutách. */
  cteni: number;
  /** <title> stránky. */
  title: string;
  /** Titulek pro sdílení (og:title). */
  ogTitulek: string;
  /** Nabídka pro lead.js (data-offer), např. "app", "web". */
  nabidka?: string;
  /** Kontaktní sekce pod článkem. */
  poptavka: { heading: string; topic: string; placeholder: string };
  /** Související články (slugy) a služby v „Mohlo by vás zajímat“. */
  souvisejici: string[];
  sluzby: SluzbaId[];
  /** Úvod medailonku autora, když se má lišit od výchozího „weby a aplikace stavím od roku 2006.“ */
  autorUvod?: string;
}

export const CLANKY: Clanek[] = [
  {
    slug: "zakon-o-kyberneticke-bezpecnosti-male-firmy",
    kategorie: "Bezpečnost a IT",
    titulek: "Týká se vaší firmy nový zákon o&nbsp;kybernetické bezpečnosti?",
    nazev: "Zákon o&nbsp;kybernetické bezpečnosti",
    popis: "Nový zákon o&nbsp;kybernetické bezpečnosti platí od listopadu 2025. Komu se týká, proč na něj narazí i&nbsp;malé firmy jako dodavatelé a&nbsp;co dát do pořádku jako první.",
    perex: "Od listopadu 2025 platí nový zákon o&nbsp;kybernetické bezpečnosti a&nbsp;týká se tisíců firem. Většina malých firem pod něj přímo nespadá – ale potká ho jako dodavatel. Co zákon říká, jak zjistit, jestli se vás týká, a&nbsp;co dát do pořádku jako první.",
    datum: "2026-11-15",
    cteni: 3,
    title: "Zákon o kybernetické bezpečnosti (NIS2) a malé firmy | WebTitan",
    ogTitulek: "Týká se vaší firmy nový zákon o kybernetické bezpečnosti?",
    poptavka: {"heading": "IT a&nbsp;bezpečnost ve vaší firmě? Probereme to", "topic": "Správa IT a sítí", "placeholder": "Např. odběratel po nás chce doložit zabezpečení dat a nevíme, kde začít."},
    souvisejici: ["weby-a-aplikace-karlovy-vary-plzen", "online-rezervace-pro-penzion"],
    sluzby: ["it", "srv"],
    autorUvod: "weby, aplikace a&nbsp;servery stavím od roku 2006.",
  },
  {
    slug: "online-rezervace-pro-penzion",
    kategorie: "Ubytování a rezervace",
    stitek: "Ubytování",
    titulek: "Online rezervace pro penzion a&nbsp;malý hotel: vlastní systém, nebo jen Booking?",
    nazev: "Online rezervace pro penzion a&nbsp;hotel",
    popis: "Jak získat víc přímých rezervací bez provize: co má umět rezervace na webu penzionu, jak ji propojit s&nbsp;Bookingem a&nbsp;Airbnb a&nbsp;kdy stačí hotová služba.",
    perex: "Spousta penzionů a&nbsp;hotelů na Karlovarsku a&nbsp;Sokolovsku stojí na hostech z&nbsp;rezervačních portálů. Ty přivedou nové lidi, ale z&nbsp;každého pobytu si vezmou provizi. Vlastní rezervace na webu ji u&nbsp;přímých hostů ušetří – a&nbsp;nemusí to být složité.",
    datum: "2026-11-14",
    cteni: 2,
    title: "Rezervace pro penzion: vlastní systém, nebo Booking? | WebTitan",
    ogTitulek: "Online rezervace pro penzion a malý hotel: vlastní systém, nebo jen Booking?",
    nabidka: "web",
    poptavka: {"heading": "Rezervace pro váš penzion? Probereme to", "topic": "Rezervační systém", "placeholder": "Např. máme penzion s 8 pokoji u Lokte a chceme rezervace přímo na webu."},
    souvisejici: ["weby-a-aplikace-karlovy-vary-plzen", "kolik-stoji-web-a-e-shop"],
    sluzby: ["web", "app"],
  },
  {
    slug: "web-pro-remeslniky-a-mistni-firmy",
    kategorie: "Weby pro místní firmy",
    stitek: "Místní firmy",
    titulek: "Web pro řemeslníky a&nbsp;místní firmy: 8 věcí, díky kterým zazvoní telefon",
    nazev: "Web pro řemeslníky a&nbsp;místní firmy",
    popis: "Co musí mít web truhláře, instalatéra, autoservisu nebo jiné místní firmy, aby z&nbsp;něj chodily zakázky: telefon, oblast, fotky prací, recenze a&nbsp;rychlost na mobilu.",
    perex: "Kdo hledá truhláře v&nbsp;Sokolově nebo instalatéra v&nbsp;Plzni, rozhoduje se rychle. Na mobilu otevře dva tři weby a&nbsp;zavolá tomu, u&nbsp;koho během pár vteřin pochopí, co dělá, kde působí a&nbsp;jak ho sehnat. Tady je osm věcí, které o&nbsp;tom rozhodují.",
    datum: "2026-11-14",
    cteni: 2,
    title: "Web pro řemeslníky: 8 věcí, které přinesou zakázky | WebTitan",
    ogTitulek: "Web pro řemeslníky a místní firmy: 8 věcí, díky kterým zazvoní telefon",
    nabidka: "web",
    poptavka: {"heading": "Web pro vaši firmu? Probereme to", "topic": "Web", "placeholder": "Např. jsme truhlářství ze Sokolova a chceme web, ze kterého budou chodit zakázky."},
    souvisejici: ["kolik-stoji-web-a-e-shop", "weby-a-aplikace-karlovy-vary-plzen"],
    sluzby: ["web", "srv"],
  },
  {
    slug: "jak-vybrat-dodavatele-webu",
    kategorie: "Výběr dodavatele",
    titulek: "Jak vybrat dodavatele webu nebo aplikace: 9 otázek, které položit před podpisem",
    nazev: "Jak vybrat dodavatele webu nebo aplikace",
    popis: "Na co se zeptat programátora nebo agentury, než si objednáte web, e-shop nebo aplikaci: vlastnictví kódu a&nbsp;domény, pevná cena, provoz, termíny a&nbsp;péče po spuštění.",
    perex: "Nabídky na web nebo aplikaci se cenou liší i&nbsp;několikanásobně a&nbsp;z&nbsp;popisu často není poznat proč. Těchto devět otázek vám pomůže nabídky porovnat a&nbsp;vyhnout se nepříjemným překvapením až po spuštění.",
    datum: "2026-11-14",
    cteni: 2,
    title: "Jak vybrat dodavatele webu nebo aplikace: 9 otázek | WebTitan",
    ogTitulek: "Jak vybrat dodavatele webu nebo aplikace: 9 otázek, které položit před podpisem",
    nabidka: "app",
    poptavka: {"heading": "Porovnáváte nabídky? Probereme to", "topic": "Zatím nevím", "placeholder": "Např. máme nabídku na nový web za 60 000 Kč a nevíme, jestli je to hodně."},
    souvisejici: ["kolik-stoji-aplikace-na-miru", "kolik-stoji-web-a-e-shop"],
    sluzby: ["app", "web"],
  },
  {
    slug: "kolik-stoji-aplikace-na-miru",
    kategorie: "Ceny a rozpočet",
    titulek: "Kolik stojí aplikace na míru a&nbsp;co cenu ovlivňuje",
    nazev: "Kolik stojí aplikace na míru",
    popis: "Kolik stojí webová aplikace na míru, co cenu nejvíc ovlivňuje a&nbsp;jak začít menší první verzí. Orientační rozsahy a&nbsp;na co se ptát dodavatele.",
    perex: "„Kolik by to stálo?“ je první otázka skoro každého hovoru. Bez znalosti zadání se na ni odpovídá těžko, ale dá se dobře vysvětlit, z&nbsp;čeho se cena skládá – a&nbsp;jak ji udržet rozumnou.",
    datum: "2026-11-14",
    cteni: 3,
    title: "Kolik stojí aplikace na míru? Ceny a co je ovlivňuje | WebTitan",
    ogTitulek: "Kolik stojí aplikace na míru? Ceny a co je ovlivňuje",
    nabidka: "app",
    poptavka: {"heading": "Kolik by stála ta vaše? Řeknu vám to", "topic": "Aplikace na míru", "placeholder": "Např. potřebujeme evidenci zakázek pro 5 lidí, dnes to vedeme v Excelu."},
    souvisejici: ["excel-nebo-aplikace", "kolik-stoji-web-a-e-shop"],
    sluzby: ["app", "mob"],
  },
  {
    slug: "excel-nebo-aplikace",
    kategorie: "Excel vs. aplikace",
    titulek: "Excel, nebo vlastní aplikace? 7 signálů, že tabulky už nestačí",
    nazev: "Excel, nebo vlastní aplikace?",
    popis: "Kdy Excel firmě přestává stačit a&nbsp;kdy se vyplatí vlastní aplikace. Sedm varovných signálů, co aplikace přinese a&nbsp;jak probíhá převod dat z&nbsp;tabulek.",
    perex: "Excel je skvělý nástroj a&nbsp;spousta firem na něm vyrostla. Jenže s&nbsp;počtem lidí, zakázek a&nbsp;verzí souborů přichází chvíle, kdy tabulka víc brzdí, než pomáhá. Podle čeho ji poznat?",
    datum: "2026-11-14",
    cteni: 3,
    title: "Excel, nebo aplikace? 7 signálů, že tabulky nestačí | WebTitan",
    ogTitulek: "Excel, nebo aplikace? 7 signálů, že tabulky nestačí",
    nabidka: "app",
    poptavka: {"heading": "Vyplatí se to i u&nbsp;vás? Probereme to", "topic": "Aplikace na míru", "placeholder": "Např. máme tři tabulky, které každý týden ručně slučujeme."},
    souvisejici: ["kolik-stoji-aplikace-na-miru", "weby-a-aplikace-karlovy-vary-plzen"],
    sluzby: ["app", "mob"],
  },
  {
    slug: "kolik-stoji-web-a-e-shop",
    kategorie: "Weby a e-shopy",
    titulek: "Kolik stojí firemní web a&nbsp;e-shop a&nbsp;jakou cestu zvolit",
    nazev: "Kolik stojí web a&nbsp;e-shop",
    popis: "Kolik stojí firemní web a&nbsp;e-shop: stavebnice, pronajatý e-shop, nebo web na míru. Co ovlivňuje cenu, s&nbsp;čím počítat u&nbsp;provozu a&nbsp;co by měl web umět.",
    perex: "Web si dnes můžete naklikat sami za pár set korun měsíčně, ale také zaplatit agentuře statisíce. Kde je rozumný střed a&nbsp;kdy se vyplatí která cesta?",
    datum: "2026-11-14",
    cteni: 3,
    title: "Kolik stojí firemní web a e-shop? Možnosti a ceny | WebTitan",
    ogTitulek: "Kolik stojí firemní web a e-shop? Možnosti a ceny",
    nabidka: "web",
    poptavka: {"heading": "Kolik by stál ten váš? Řeknu vám to", "topic": "Web", "placeholder": "Např. potřebujeme web pro truhlářství s galerií a poptávkovým formulářem."},
    souvisejici: ["weby-a-aplikace-karlovy-vary-plzen", "kolik-stoji-aplikace-na-miru"],
    sluzby: ["web", "shop"],
  },
  {
    slug: "weby-a-aplikace-karlovy-vary-plzen",
    kategorie: "Západní Čechy",
    titulek: "Weby a&nbsp;aplikace pro firmy v&nbsp;Karlovarském a&nbsp;Plzeňském kraji",
    nazev: "Weby a&nbsp;aplikace v&nbsp;západních Čechách",
    popis: "Tvorba webů, e-shopů a&nbsp;aplikací pro firmy z&nbsp;Karlovarského a&nbsp;Plzeňského kraje. Osobní schůzka, rezervace pro ubytování, lokální vyhledávání a&nbsp;péče o&nbsp;web.",
    perex: "Sídlím v&nbsp;Horním Slavkově u&nbsp;Sokolova a&nbsp;pracuji hlavně pro firmy ze západních Čech. Co má smysl řešit u&nbsp;webu a&nbsp;aplikací právě tady – a&nbsp;proč se vyplatí dodavatel, se kterým se můžete potkat osobně?",
    datum: "2026-11-14",
    cteni: 3,
    title: "Weby a aplikace pro firmy – Karlovy Vary, Sokolov, Plzeň | WebTitan",
    ogTitulek: "Weby a aplikace pro firmy – Karlovy Vary, Sokolov, Plzeň",
    nabidka: "app",
    poptavka: {"heading": "Jste z&nbsp;Karlovarského nebo Plzeňského kraje? Potkejme se", "topic": "Zatím nevím", "placeholder": "Např. potřebujeme nový web a rezervace pro náš penzion u Karlových Varů."},
    souvisejici: ["kolik-stoji-web-a-e-shop", "excel-nebo-aplikace"],
    sluzby: ["web", "app"],
  },
];

export const clanek = (slug: string): Clanek => {
  const c = CLANKY.find((x) => x.slug === slug);
  if (!c) throw new Error(`Neznámý článek: ${slug}`);
  return c;
};
