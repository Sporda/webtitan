import React from "react";

export const AboutSection = () => {
  return (
    <section id="about" className="relative z-[4] py-20">
      <div className="container mx-auto px-4">
        <div
          id="about-content"
          className="mx-auto max-w-4xl rounded-xl bg-[rgba(18,16,23,0.8)] p-8 shadow-[0_80px_60px_rgba(0,0,0,0.12)] backdrop-blur-[10px] md:p-12"
        >
          <h2 className="text-shadow-strong mb-8 text-center text-3xl font-bold text-white">
            O mně
          </h2>

          <div className="space-y-6 leading-relaxed text-white/90">
            <p className="text-lg">
              Jsem{" "}
              <strong className="text-white">
                senior full-stack JavaScript vývojář
              </strong>{" "}
              se specializací na vývoj webových aplikací na míru, tvorbu
              webových stránek, interních systémů a komplexních API integrací.
            </p>

            <p>
              Díky zkušenostem s technologiemi jako{" "}
              <span className="font-semibold text-[#32e6f0]">React</span>,
              <span className="font-semibold text-[#32e6f0]"> Node.js</span> a
              <span className="font-semibold text-[#32e6f0]"> TypeScript</span>{" "}
              navrhuji moderní a škálovatelná řešení pro firmy i startupy.
            </p>

            <p>
              Poskytuji také vývoj e-shopů, digitální transformaci, správu
              serverů a další DevOps služby.
            </p>

            <p className="text-lg font-medium">
              Jako freelance programátor nabízím{" "}
              <span className="text-[#32e6f0]">flexibilitu</span> a
              <span className="text-[#32e6f0]"> individuální přístup</span> ke
              každému projektu – od návrhu až po úspěšné nasazení.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
