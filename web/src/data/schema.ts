// Údaje o mně a o WebTitanu pro vyhledávače (schema.org) – úvodní stránka je vypisuje jako JSON-LD.
// Telefon, e-mail, odkazy a oblast působení se berou z data/site.ts a lib/ld.ts.
import { castkaText } from "./sluzby";
import { SITE_URL, OG_IMAGE, EMAIL, PHONE_LONG, LINKEDIN, GITHUB } from "./site";
import { AREA_SERVED, PROVIDER, AUTHOR } from "../lib/ld";
import { plain } from "../lib/text";

const TELEPHONE = plain(PHONE_LONG);

export const PERSON = {
 "@type": "Person",
 "@id": AUTHOR["@id"],
 "name": "Jan Šporek",
 "jobTitle": "Full-stack vývojář webových a mobilních aplikací",
 "url": `${SITE_URL}/`,
 "email": `mailto:${EMAIL}`,
 "telephone": TELEPHONE,
 "image": `${SITE_URL}/assets/jan-cut.webp`,
 "sameAs": [LINKEDIN, GITHUB],
 "knowsAbout": [
  "Webové aplikace na míru",
  "Mobilní aplikace",
  "Firemní weby",
  "E-shopy",
  "Integrace API",
  "Správa serverů",
  "Správa počítačových sítí",
  "Next.js",
  "React",
  "Node.js",
  "TypeScript"
 ],
 "worksFor": {
  "@id": PROVIDER["@id"]
 }
};

export const BUSINESS = {
 "@type": "ProfessionalService",
 "@id": PROVIDER["@id"],
 "name": "WebTitan",
 "url": `${SITE_URL}/`,
 "logo": `${SITE_URL}/assets/logo-webtitan.png`,
 "image": OG_IMAGE,
 "email": EMAIL,
 "telephone": TELEPHONE,
 "description": `Aplikace na míru od ${castkaText("app")}, weby od ${castkaText("web")} a e-shopy od ${castkaText("shop")} pro firmy z Karlovarského a Plzeňského kraje. Pevná cena předem, přímo s programátorem.`,
 "founder": {
  "@id": AUTHOR["@id"]
 },
 "address": {
  "@type": "PostalAddress",
  "streetAddress": "Dlouhá 705/38",
  "addressLocality": "Horní Slavkov",
  "postalCode": "357 31",
  "addressCountry": "CZ"
 },
 "identifier": {
  "@type": "PropertyValue",
  "propertyID": "IČO",
  "value": "74792148"
 },
 "areaServed": AREA_SERVED,
 "priceRange": `od ${castkaText("web")}`,
 "sameAs": [
  "https://www.google.com/maps?cid=14794570339533951439",
  "https://www.firmy.cz/detail/14099683-webtitan-jan-sporek-horni-slavkov.html",
  LINKEDIN,
  GITHUB
 ]
};

export const WEBSITE = {
 "@type": "WebSite",
 "@id": `${SITE_URL}/#web`,
 "url": `${SITE_URL}/`,
 "name": "WebTitan",
 "inLanguage": "cs",
 "publisher": {
  "@id": PROVIDER["@id"]
 }
};
