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
        y: "-100vh",
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

  const onContact = () => {
    // zascrolovat na kontakt sekci
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={heroRef}
      className="hero-section relative z-[5] flex items-center justify-center pb-20 pt-36"
    >
      <div className="container mx-auto px-4">
        <MainProfileCard
          image={image}
          title="Jan Šporek"
          subtitle="Full-stack JavaScript vývojář"
          description="Díky mnohaletým zkušenostem dokážu navrhnout a realizovat řešení na míru – ať už jde o webové stránky, aplikace, nebo komplexní API napojené na externí služby."
          onDownloadCV={() => {}}
          onContact={onContact}
        />
      </div>
    </section>
  );
};
