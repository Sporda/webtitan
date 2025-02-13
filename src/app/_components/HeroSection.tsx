import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      id="about"
      className="relative bg-cover bg-center py-32 md:py-48 lg:py-64"
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/70 to-black/50"></div>
      <div className="container relative z-10 mx-auto px-4">
        <div className="flex h-full flex-col items-center justify-center text-center text-white">
          <h1 className="animate-fade-in-up mb-6 text-5xl font-bold md:text-6xl lg:text-7xl">
            IT Specialista
          </h1>
          <h2 className="animate-fade-in-up mb-6 text-3xl font-bold md:text-4xl lg:text-5xl">
            Fullstack programátor a system administrator
          </h2>
          <p className="animate-fade-in-up animation-delay-200 mb-12 max-w-3xl text-xl md:text-2xl lg:text-3xl">
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
}
