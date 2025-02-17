"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
// import { SphereCubes } from "./SphereCubes";

export const HeroSection = () => {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;

    gsap.fromTo(
      heroRef.current,
      {
        y: "100vh",
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 2.2,
        ease: "power3.out",
        delay: 0.3,
      },
    );
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative z-[5] flex min-h-screen items-center justify-center"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center text-white">
          <h1 className="animate-fade-in-up mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">
            IT Specialista
          </h1>
          <h2 className="animate-fade-in-up mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
            Fullstack programátor a system administrator
          </h2>
          <p className="animate-fade-in-up animation-delay-200 mb-8 max-w-3xl text-lg md:text-xl lg:text-2xl">
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
    </section>
  );
};
