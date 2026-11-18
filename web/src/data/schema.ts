// Údaje o mně a o WebTitanu pro vyhledávače (schema.org) – úvodní stránka je vypisuje jako JSON-LD.
// Telefon, e-mail a odkazy držte ve shodě s data/site.ts.

export const PERSON = {
 "@type": "Person",
 "@id": "https://webtitan.cz/#jan",
 "name": "Jan Šporek",
 "jobTitle": "Full-stack vývojář webových a mobilních aplikací",
 "url": "https://webtitan.cz/",
 "email": "mailto:kontakt@webtitan.cz",
 "telephone": "+420 723 793 510",
 "image": "https://webtitan.cz/assets/jan-cut.webp",
 "sameAs": [
  "https://www.linkedin.com/in/jan-%C5%A1porek-07a39168/",
  "https://github.com/jansporek"
 ],
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
  "@id": "https://webtitan.cz/#webtitan"
 }
};

export const BUSINESS = {
 "@type": "ProfessionalService",
 "@id": "https://webtitan.cz/#webtitan",
 "name": "WebTitan",
 "url": "https://webtitan.cz/",
 "logo": "https://webtitan.cz/assets/logo-webtitan.png",
 "image": "https://webtitan.cz/assets/og.jpg",
 "email": "kontakt@webtitan.cz",
 "telephone": "+420 723 793 510",
 "description": "Aplikace na míru od 24 950 Kč, weby od 9 970 Kč a e-shopy od 19 870 Kč pro firmy z Karlovarského a Plzeňského kraje. Pevná cena předem, přímo s programátorem.",
 "founder": {
  "@id": "https://webtitan.cz/#jan"
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
 "areaServed": [
  {
   "@type": "AdministrativeArea",
   "name": "Karlovarský kraj"
  },
  {
   "@type": "AdministrativeArea",
   "name": "Plzeňský kraj"
  },
  {
   "@type": "City",
   "name": "Karlovy Vary"
  },
  {
   "@type": "City",
   "name": "Sokolov"
  },
  {
   "@type": "City",
   "name": "Cheb"
  },
  {
   "@type": "City",
   "name": "Plzeň"
  },
  {
   "@type": "Country",
   "name": "Česká republika"
  }
 ],
 "priceRange": "od 9 970 Kč",
 "sameAs": [
  "https://www.google.com/maps?cid=14794570339533951439",
  "https://www.firmy.cz/detail/14099683-webtitan-jan-sporek-horni-slavkov.html",
  "https://www.linkedin.com/in/jan-%C5%A1porek-07a39168/",
  "https://github.com/jansporek"
 ]
};

export const WEBSITE = {
 "@type": "WebSite",
 "@id": "https://webtitan.cz/#web",
 "url": "https://webtitan.cz/",
 "name": "WebTitan",
 "inLanguage": "cs",
 "publisher": {
  "@id": "https://webtitan.cz/#webtitan"
 }
};
