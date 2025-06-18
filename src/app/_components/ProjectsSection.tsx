import { api } from "@/trpc/server";
import type { ProjectData } from "@/types/project";
import { ProjectsClient } from "./ProjectsClient";

export async function ProjectsSection() {
  // Načteme projekty z databáze přes tRPC
  const allProjects: ProjectData[] = await api.project.getAll();

  // Definujeme pořadí projektů
  const featuredProjectNames = [
    "Tepp",
    "Unlikely",
    "Fitness Ural",
    "2MSKV",
    "Markop Okna",
    "Sokolov Ubytování",
  ];

  const fadeProjectNames = ["Rybar Transport", "Plenkový servis", "Kotelna 55"];

  // Filtrujeme a seřadíme projekty
  const featuredProjects = featuredProjectNames
    .map((name) => allProjects.find((p: ProjectData) => p.title === name))
    .filter(Boolean) as ProjectData[];

  const fadeProjects = fadeProjectNames
    .map((name) => allProjects.find((p: ProjectData) => p.title === name))
    .filter(Boolean) as ProjectData[];

  // Ostatní projekty (ty co nejsou featured ani fade)
  const usedProjectNames = [...featuredProjectNames, ...fadeProjectNames];
  const otherProjects = allProjects.filter(
    (project: ProjectData) => !usedProjectNames.includes(project.title),
  );

  return (
    <section id="projects" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-shadow-strong mb-12 text-center text-3xl font-bold text-white">
          Moje projekty
        </h2>

        <ProjectsClient
          featuredProjects={featuredProjects}
          fadeProjects={fadeProjects}
          otherProjects={otherProjects}
        />
      </div>
    </section>
  );
}
