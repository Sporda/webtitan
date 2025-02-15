"use client";

import { Button } from "@/components/ui/button";
// import { SphereCubes } from "./SphereCubes";

export const HeroSection = () => {
  return (
    <section className="relative">
      <div className="relative z-10">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/70 to-black/50"></div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="order-2 flex max-h-[300px] justify-start md:order-1 md:max-h-[350px] md:justify-end lg:max-h-[500px]">
              <div className="relative left-[-20%] origin-center scale-[0.25] transform sm:left-[10%] md:left-[15%] md:mt-[-20px] md:scale-[0.28] lg:left-[30%] lg:mt-[-20px] lg:scale-[0.3] xl:left-[0%]">
                {/* <SphereCubes /> */}
              </div>
            </div>
            <div className="order-1 col-span-1 flex flex-col items-center text-center text-white md:order-2 md:col-span-1 md:items-start md:text-left lg:col-span-2">
              <h1 className="animate-fade-in-up mb-3 text-3xl font-bold sm:text-4xl md:mb-4 md:text-5xl lg:text-6xl">
                IT Specialista
              </h1>
              <h2 className="animate-fade-in-up mb-3 text-xl font-bold sm:text-2xl md:mb-4 md:text-3xl lg:text-4xl">
                Fullstack programátor a system administrator
              </h2>
              <p className="animate-fade-in-up animation-delay-200 mb-6 max-w-3xl text-base sm:text-lg md:mb-8 md:text-xl lg:text-2xl">
                Pokud pracujete v technologiích, vytváříte budoucnost
              </p>
              <Button
                size="lg"
                className="animate-fade-in-up animation-delay-400 transition-transform duration-300 hover:scale-105"
              >
                Stáhnout CV
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
