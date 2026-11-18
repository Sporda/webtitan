// Časté otázky – jedna sada pro celý web. Stránky si vybírají otázky podle id (otazky([...])) a stejné
// znění jde na stránku i do strukturovaných dat (FAQPage). Texty jsou HTML (&nbsp;).

export interface Otazka {
  q: string;
  a: string;
  /** Jiný text odpovědi jen pro vyhledávače (JSON-LD), když se má lišit od stránky. */
  ld?: string;
}

export const OTAZKY: Record<string, Otazka> = {
  "jak-probiha-15min-hovor": { q: "Jak probíhá 15min hovor?", a: "Ve vybraný čas vám zavolám, nebo pošlu odkaz na videohovor. Zeptám se, co dnes řešíte a&nbsp;co by vám pomohlo. Řeknu vám upřímně, jestli a&nbsp;jak to dává smysl a&nbsp;v&nbsp;jakém cenovém rozmezí se pohybujeme. Nic nepodepisujete a&nbsp;k&nbsp;ničemu se nezavazujete." },
  "kde-pusobite-muzeme-potkat": { q: "Kde působíte? Můžeme se potkat osobně?", a: "Sídlím v&nbsp;Horním Slavkově u&nbsp;Sokolova. Za firmami z&nbsp;Karlovarského a&nbsp;Plzeňského kraje rád přijedu osobně – Karlovy Vary, Sokolov, Cheb, Ostrov, Mariánské Lázně i&nbsp;Plzeň. S&nbsp;klienty z&nbsp;ostatních krajů pracuji na dálku po telefonu, přes videohovor a&nbsp;e-mail – funguje to stejně dobře." },
  "kolik-bude-stat": { q: "Kolik to bude stát?", a: "Aplikace na míru začínají od 24&nbsp;950&nbsp;Kč, firemní web od 9&nbsp;970&nbsp;Kč a&nbsp;e-shop od 19&nbsp;870&nbsp;Kč – vždy jednorázově, bez licencí za uživatele. Mobilní aplikaci nacením podle rozsahu. Po úvodním hovoru dostanete pevnou cenu za konkrétní rozsah. Co si odsouhlasíme, to platí. Provoz a&nbsp;správa se platí zvlášť, od 990&nbsp;Kč měsíčně. Nejsem plátce DPH, takže uvedené ceny jsou konečné." },
  "delate-mobilni-aplikace": { q: "Děláte i&nbsp;mobilní aplikace?", a: "Ano. Postavím aplikaci pro iOS i&nbsp;Android – pro vaše zákazníky (objednávky, rezervace, věrnostní program) nebo pro zaměstnance v&nbsp;terénu. Napojím ji na váš systém, web nebo e-shop a&nbsp;pomůžu s&nbsp;vydáním v&nbsp;App Store a&nbsp;Google Play. Cenu řeknu podle rozsahu po úvodním hovoru." },
  "nemam-presne-zadani-vadi": { q: "Nemám přesné zadání. Vadí to?", a: "Nevadí – většina klientů ho nemá. Stačí popsat, co vás dnes zdržuje. Zadání dáme dohromady na úvodním hovoru a&nbsp;já ho pak sepíšu." },
  "jak-dlouho-trva": { q: "Jak dlouho to trvá?", a: "Firemní web obvykle 2–4 týdny, aplikace typicky 3–6 týdnů od schválení rozsahu, e-shop podle rozsahu. Přesný termín dostanete spolu s&nbsp;cenou. Začít můžete i&nbsp;menší první verzí." },
  "komu-patri-aplikace-web": { q: "Komu patří aplikace, web a&nbsp;data?", a: "Vám. Kód, data i&nbsp;doména jsou vaše a&nbsp;data si můžete kdykoli vyexportovat. Nejste na mně závislí." },
  "umite-prevzit-data-excelu": { q: "Umíte převzít data z&nbsp;Excelu?", a: "Ano. Převod dat ze stávajících tabulek je běžnou součástí spuštění, abyste nezačínali od nuly." },
  "budu-si-moci-web": { q: "Budu si moci web upravovat sám?", a: "Ano. Texty, fotky, produkty i&nbsp;novinky si upravíte v&nbsp;jednoduché administraci. Větší změny rád udělám za vás." },
  "napojite-ucetnictvi-platby-nebo": { q: "Napojíte to na účetnictví, platby nebo jiný systém?", a: "Propojování služeb je moje specialita. Pokud druhá strana nabízí rozhraní (API), napojím na ni aplikaci i&nbsp;web – platební brány, účetní systémy, e-mail a&nbsp;další." },
  "postarate-hosting-provoz": { q: "Postaráte se i&nbsp;o&nbsp;hosting a&nbsp;provoz?", a: "Ano. Servery spravuji sám – hosting, aktualizace, zálohy i&nbsp;dohled. Nemusíte hledat dalšího dodavatele ani „toho, kdo to kdysi dělal“." },
  "co-stane-po-odeslani": { q: "Co se stane po odeslání formuláře?", a: "Do 24 hodin (v&nbsp;pracovní dny) se vám ozvu osobně – e-mailem, nebo zavolám. U&nbsp;žádosti o&nbsp;hovor vám termín potvrdím e-mailem. Nic nepodepisujete a&nbsp;nic neplatíte." },
  "prijedete-osobne": { q: "Přijedete i&nbsp;osobně?", a: "Ano. Sídlím u&nbsp;Sokolova a&nbsp;v&nbsp;Karlovarském kraji jezdím osobně – na prohlídku sítě, instalaci i&nbsp;když něco nejde vyřešit na dálku. Většinu běžných věcí ale vyřeším vzdáleně, rychleji a&nbsp;bez ceny za cestu." },
  "kolik-stoji-sprava-it": { q: "Kolik stojí správa IT a&nbsp;sítě?", a: "Správa začíná od 1 490 Kč měsíčně. Cena se odvíjí od počtu počítačů a&nbsp;zařízení v&nbsp;síti. Pevnou cenu dostanete po prohlídce – co si odsouhlasíme, to platí. Nejsem plátce DPH, takže uvedené ceny jsou konečné." },
  "co-kdyz-budete-nemocny": { q: "Co když budete nemocný nebo na dovolené?", a: "Reakční dobu si domluvíme předem a&nbsp;písemně – slibuji jen to, co opravdu zvládnu. Síť, zálohy i&nbsp;přístupy mám popsané v&nbsp;dokumentaci, kterou máte i&nbsp;vy. Dovolenou hlásím s&nbsp;předstihem a&nbsp;kritické věci hlídá dohled, který mi pošle upozornění kdekoli." },
  "tyka-nas-novy-zakon": { q: "Týká se nás nový zákon o&nbsp;kybernetické bezpečnosti?", a: "Zákon platí od 1. listopadu 2025 a&nbsp;týká se hlavně středních a&nbsp;větších firem ve vybraných oborech. Menší firmy ho ale potkají jako dodavatelé – velcí odběratelé po nich začínají chtít základní zabezpečení. Víc v&nbsp;článku <a href=\"/clanky/zakon-o-kyberneticke-bezpecnosti-male-firmy/\">Týká se vaší firmy nový zákon o&nbsp;kybernetické bezpečnosti?</a> Pomůžu vám zjistit, jestli pod zákon spadáte, a&nbsp;dát do pořádku technické základy. Právní posouzení nedělám, na to vám doporučím odborníka.", ld: "Zákon platí od 1. listopadu 2025 a týká se hlavně středních a větších firem ve vybraných oborech. Menší firmy ho ale potkají jako dodavatelé – velcí odběratelé po nich začínají chtít základní zabezpečení. Pomůžu vám zjistit, jestli pod zákon spadáte, a dát do pořádku technické základy. Právní posouzení nedělám, na to vám doporučím odborníka." },
  "komu-patri-hesla-pristupy": { q: "Komu patří hesla a&nbsp;přístupy?", a: "Vám. Hesla, přístupy k&nbsp;zařízením i&nbsp;dokumentaci sítě máte u&nbsp;sebe. Když se rozhodnete pro jiného správce, předám mu všechno v&nbsp;pořádku. Nejste na mně závislí." },
  "kolik-stoji-sprava-serveru": { q: "Kolik stojí správa serveru a&nbsp;webu?", a: "Správa serveru a&nbsp;webu začíná od 990 Kč měsíčně. Přesnou cenu dostanete po úvodním hovoru – co si odsouhlasíme, to platí. Nejsem plátce DPH, takže uvedené ceny jsou konečné." },
};

export const otazky = (ids: string[]): Otazka[] =>
  ids.map((id) => {
    const o = OTAZKY[id];
    if (!o) throw new Error(`Neznámá otázka: ${id}`);
    return o;
  });
