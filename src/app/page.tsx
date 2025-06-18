import { api, HydrateClient } from "@/trpc/server";
import { Header } from "./_components/Header";
import { HeroSection } from "./_components/HeroSection";
import { ServicesSection } from "./_components/ServicesSection";
import { SkillsSection } from "./_components/SkillsSection";
import { ProjectsSection } from "./_components/ProjectsSection";
import { CareerSection } from "./_components/CareerSection";
import { AboutSection } from "./_components/AboutSection";
import { ContactSection } from "./_components/ContactSection";
import { Footer } from "./_components/Footer";
import { Providers } from "./_components/Providers";
import { ParallaxBackground } from "./_components/ParallaxBackground";
import { Birds } from "./_components/Parallax/birds/Birds";
import { JsonLd } from "./_components/JsonLd";
export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  // Prefetch projects data for better UX
  void api.project.getAll.prefetch();

  return (
    <HydrateClient>
      <JsonLd />
      <Providers>
        {/* Parallax kontejner */}
        <div className="fixed inset-0 h-[6000px]">
          <ParallaxBackground />
        </div>

        <Birds />

        {/* Obsah */}
        <div className="relative">
          <div className="sticky top-0 z-50 w-full">
            <Header />
          </div>

          <main className="relative z-40 mb-20 flex flex-col items-center">
            <HeroSection />
            <ServicesSection />
            <SkillsSection />
            <ProjectsSection />
            <CareerSection />
            <AboutSection />
            <ContactSection />
          </main>

          <div className="w-full bg-black/50">
            <Footer />
          </div>
        </div>
      </Providers>
    </HydrateClient>
  );
}
