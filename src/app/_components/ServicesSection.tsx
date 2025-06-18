"use client";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ServiceCard = ({ title, description, icon }: ServiceCardProps) => {
  return (
    <div className="service-card flex h-80 flex-col justify-between rounded-xl bg-[rgba(18,16,23,0.8)] p-8 shadow-[0_80px_60px_rgba(0,0,0,0.12)] backdrop-blur-[10px] transition-all duration-300 hover:scale-105 hover:transform">
      <div>
        <div className="mb-6 flex justify-center">{icon}</div>
        <h3 className="mb-4 text-center text-xl font-semibold text-white">
          {title}
        </h3>
      </div>
      <p className="text-center leading-relaxed text-white/70">{description}</p>
    </div>
  );
};

export const ServicesSection = () => {
  const services = [
    {
      title: "Webové aplikace na míru",
      description:
        "Vytváříme moderní a efektivní webové aplikace přesně podle vašich potřeb – od návrhu po finální nasazení.",
      icon: (
        <svg
          className="h-12 w-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Integrace API a návrh backendové architektury",
      description:
        "Propojíme váš systém s externími službami a navrhneme robustní a škálovatelný backend, který zvládne růst s vaším projektem.",
      icon: (
        <svg
          className="h-12 w-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Správa serverů",
      description:
        "Zajistíme bezpečný a spolehlivý provoz vašeho serverového prostředí – monitoring, aktualizace i automatizaci správy.",
      icon: (
        <svg
          className="h-12 w-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      ),
    },
  ];

  return (
    <section id="services" className="relative z-[4] py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-shadow-strong mb-12 text-center text-3xl font-bold text-white">
          Jak vám pomohu
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              description={service.description}
              icon={service.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
