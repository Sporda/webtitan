import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { Header } from "./_components/Header";
import { HeroSection } from "./_components/HeroSection";
import { SkillsSection } from "./_components/SkillsSection";
import { ProjectsSection } from "./_components/ProjectsSection";
import { ContactSection } from "./_components/ContactSection";
import { Footer } from "./_components/Footer";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-grow">
          <HeroSection />
          <SkillsSection />
          <ProjectsSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </HydrateClient>
  );
}
