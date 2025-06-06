import { api, HydrateClient } from "@/trpc/server";
import { Header } from "./_components/Header";
import { HeroSection } from "./_components/HeroSection";
import { SkillsSection } from "./_components/SkillsSection";
import { ProjectsSection } from "./_components/ProjectsSection";
import { ContactSection } from "./_components/ContactSection";
import { Footer } from "./_components/Footer";
import { Providers } from "./_components/Providers";
import { ParallaxBackground } from "./_components/ParallaxBackground";
import { Birds } from "./_components/Parallax/birds/Birds";
export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  return (
    <HydrateClient>
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

          <main className="relative z-40 flex flex-col items-center">
            <HeroSection />
            <SkillsSection />
            <ProjectsSection />
            <ContactSection />
          </main>

          <div className="fixed bottom-0 z-50 w-full bg-black/50">
            <Footer />
          </div>
        </div>
      </Providers>
    </HydrateClient>
  );
}
