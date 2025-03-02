"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
// import { SphereCubes } from "./SphereCubes";
import { MainProfileCard } from "./PageParts/MainProfileCard";
import image from "../../../public/JanSporekProfileCut.png";

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
      className="hero-section relative z-[5] flex min-h-screen items-center justify-center"
    >
      <div className="container mx-auto px-4">
        <MainProfileCard
          image={image}
          title="Jan Šporek"
          subtitle="Senior full-stack JavaScript vývojář"
          description="Díky mnohaletým zkušenostem dokážu navrhnout a realizovat řešení na míru – ať už jde o webové stránky, aplikace, nebo komplexní API napojené na externí služby."
          onDownloadCV={() => {}}
          onFollow={() => {}}
        />
      </div>
    </section>
  );
};
