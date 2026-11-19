// Strukturovaná data (schema.org JSON-LD) skládaná ze stejných dat, ze kterých se kreslí stránka.
import { SITE_URL, OG_IMAGE } from "../data/site";
import { plain } from "./text";

export const PROVIDER = { "@type": "ProfessionalService", "@id": `${SITE_URL}/#webtitan`, name: "WebTitan", url: `${SITE_URL}/` };
export const AUTHOR = { "@type": "Person", "@id": `${SITE_URL}/#jan`, name: "Jan Šporek", url: `${SITE_URL}/#o-mne` };

export const AREA_SERVED = [
  { "@type": "AdministrativeArea", name: "Karlovarský kraj" },
  { "@type": "AdministrativeArea", name: "Plzeňský kraj" },
  { "@type": "City", name: "Karlovy Vary" },
  { "@type": "City", name: "Sokolov" },
  { "@type": "City", name: "Cheb" },
  { "@type": "City", name: "Plzeň" },
  { "@type": "Country", name: "Česká republika" },
];

export const graph = (...items: unknown[]) => ({ "@context": "https://schema.org", "@graph": items.filter(Boolean) });

/** Drobečková navigace: [["Domů", "/"], ["Tvorba webu", "/tvorba-webu/"]] – stejné položky jako <Crumbs> (názvy
 *  můžou být HTML, sem jdou jako prostý text). */
export const crumbsLd = (items: [string, string][]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name: plain(name), item: SITE_URL + path })),
});

/** Otázky a odpovědi (HTML z FAQ na stránce → prostý text). ld = jiný text odpovědi jen pro vyhledávače
 *  (např. bez věty s odkazem na článek). */
export const faqLd = (items: { q: string; a: string; ld?: string }[]) => ({
  "@type": "FAQPage",
  mainEntity: items.map((f) => ({ "@type": "Question", name: plain(f.q), acceptedAnswer: { "@type": "Answer", text: f.ld ?? plain(f.a) } })),
});

export interface ServiceLd {
  path: string;
  name: string;
  serviceType: string;
  description: string;
  /** Nejnižší cena v Kč; monthly = za měsíc. Bez ceny se nabídka neuvádí (mobilní aplikace: podle rozsahu). */
  minPrice?: number;
  monthly?: boolean;
  areaServed?: unknown[];
}

export const serviceLd = (s: ServiceLd) => ({
  "@type": "Service",
  "@id": `${SITE_URL}${s.path}#sluzba`,
  name: s.name,
  serviceType: s.serviceType,
  description: s.description,
  url: SITE_URL + s.path,
  provider: PROVIDER,
  areaServed: s.areaServed ?? AREA_SERVED,
  ...(s.minPrice !== undefined && {
    offers: {
      "@type": "Offer",
      priceCurrency: "CZK",
      priceSpecification: s.monthly
        ? { "@type": "UnitPriceSpecification", minPrice: s.minPrice, priceCurrency: "CZK", unitCode: "MON", unitText: "měsíc" }
        : { "@type": "PriceSpecification", minPrice: s.minPrice, priceCurrency: "CZK" },
    },
  }),
});

/** Rozcestník článků: blog se seznamem článků (nejnovější první). */
export const blogLd = (description: string, posts: { path: string; headline: string; published: string }[]) => ({
  "@type": "Blog",
  "@id": `${SITE_URL}/clanky/#blog`,
  name: "Články – WebTitan",
  url: `${SITE_URL}/clanky/`,
  inLanguage: "cs",
  description,
  publisher: { "@id": PROVIDER["@id"] },
  blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.headline, url: SITE_URL + p.path, datePublished: p.published, author: AUTHOR })),
});

export interface ArticleLdInput { path: string; headline: string; description: string; published: string; modified?: string }

export const articleLd = (a: ArticleLdInput) => ({
  "@type": "BlogPosting",
  "@id": `${SITE_URL}${a.path}#clanek`,
  headline: a.headline,
  description: a.description,
  datePublished: a.published,
  dateModified: a.modified ?? a.published,
  inLanguage: "cs",
  mainEntityOfPage: SITE_URL + a.path,
  url: SITE_URL + a.path,
  image: OG_IMAGE,
  author: AUTHOR,
  publisher: PROVIDER,
});
