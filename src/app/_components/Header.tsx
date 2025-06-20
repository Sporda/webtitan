"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 z-10 w-full bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="image-wrapper">
              <Image
                src="/webtitanLogo_32px.png"
                alt="WebTitan"
                width={32}
                height={32}
              />
            </div>
          </Link>
          <Link href="/" className="text-2xl font-bold">
            WebTitan
          </Link>
        </div>

        {/* Hamburger tlačítko */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
        >
          <div className="space-y-2">
            <span
              className={`block h-0.5 w-6 bg-white transition-all ${isMenuOpen ? "translate-y-2.5 rotate-45" : ""}`}
            ></span>
            <span
              className={`block h-0.5 w-6 bg-white transition-all ${isMenuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block h-0.5 w-6 bg-white transition-all ${isMenuOpen ? "-translate-y-2.5 -rotate-45" : ""}`}
            ></span>
          </div>
        </button>

        {/* Navigace */}
        <nav
          className={`${isMenuOpen ? "block" : "hidden"} absolute left-0 top-full w-full bg-black/50 backdrop-blur-sm md:relative md:top-0 md:block md:w-auto md:bg-transparent md:backdrop-blur-none`}
        >
          <ul className="flex flex-col space-y-4 p-4 md:flex-row md:space-x-4 md:space-y-0 md:p-0">
            <li>
              <button
                className="nav-link"
                onClick={() => scrollToSection("about")}
              >
                O mně
              </button>
            </li>
            <li>
              <button
                className="nav-link"
                onClick={() => scrollToSection("services")}
              >
                Služby
              </button>
            </li>
            <li>
              <button
                className="nav-link"
                onClick={() => scrollToSection("skills")}
              >
                Technologie
              </button>
            </li>
            <li>
              <button
                className="nav-link"
                onClick={() => scrollToSection("projects")}
              >
                Projekty
              </button>
            </li>
            <li>
              <button
                className="nav-link"
                onClick={() => scrollToSection("career")}
              >
                Kariéra
              </button>
            </li>
            <li>
              <button
                className="nav-link"
                onClick={() => scrollToSection("contact")}
              >
                Kontakt
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
