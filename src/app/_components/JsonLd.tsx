export function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Jan Šporek",
    jobTitle: "Senior Full-stack JavaScript Developer",
    description:
      "Senior full-stack JavaScript vývojář specializující se na React, Next.js, Node.js a TypeScript. Nabízím webové aplikace na míru, e-shopy, API integrace a DevOps služby.",
    image: "https://webtitan.cz/JanSporekProfile.jpg",
    url: "https://webtitan.cz",
    email: "mailto:kontakt@webtitan.cz",
    telephone: "+420123456789",
    address: {
      "@type": "PostalAddress",
      addressCountry: "CZ",
      addressRegion: "Česká republika",
    },
    knowsAbout: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Full-stack Development",
      "Web Development",
      "API Integration",
      "DevOps",
      "E-commerce Development",
    ],
    sameAs: [
      "https://www.linkedin.com/in/jan-%C5%A1porek-07a39168/",
      "https://github.com/jansporek",
    ],
    worksFor: {
      "@type": "Organization",
      name: "WebTitan",
      url: "https://webtitan.cz",
    },
    offers: {
      "@type": "Service",
      serviceType: "Web Development Services",
      description:
        "Webové aplikace na míru, e-shopy, API integrace a DevOps služby",
      provider: {
        "@type": "Person",
        name: "Jan Šporek",
      },
      areaServed: {
        "@type": "Country",
        name: "Česká republika",
      },
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WebTitan",
    url: "https://webtitan.cz",
    logo: "https://webtitan.cz/webtitanLogo.png",
    description:
      "Profesionální vývoj webových aplikací na míru, e-shopů a API integrací",
    address: {
      "@type": "PostalAddress",
      addressCountry: "CZ",
    },
    founder: {
      "@type": "Person",
      name: "Jan Šporek",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "kontakt@webtitan.cz",
      availableLanguage: ["Czech", "English"],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
    </>
  );
}
