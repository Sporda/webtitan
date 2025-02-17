import { api, HydrateClient } from "@/trpc/server";
import { Header } from "./_components/Header";
import { HeroSection } from "./_components/HeroSection";
import { SkillsSection } from "./_components/SkillsSection";
import { ProjectsSection } from "./_components/ProjectsSection";
import { ContactSection } from "./_components/ContactSection";
import { Footer } from "./_components/Footer";
import { Providers } from "./_components/Providers";
import { ParallaxBackground } from "./_components/ParallaxBackground";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  return (
    <HydrateClient>
      <Providers>
        <div id="container">
          <ParallaxBackground />
          <div className="fixed top-0 z-10">
            <Header />
          </div>
          <main>
            {/* <HeroSection /> */}
            {/* <SkillsSection />
            <ProjectsSection />
            <ContactSection /> */}
          </main>
          <div className="fixed bottom-0 z-10 w-full bg-black/50">
            <Footer />
          </div>
        </div>
      </Providers>
    </HydrateClient>
  );
}
