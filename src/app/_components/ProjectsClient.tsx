"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProjectData } from "@/types/project";
import Image from "next/image";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProjectsClientProps {
  featuredProjects: ProjectData[];
  fadeProjects: ProjectData[];
  otherProjects: ProjectData[];
}

export function ProjectsClient({
  featuredProjects,
  fadeProjects,
  otherProjects,
}: ProjectsClientProps) {
  const [showAllProjects, setShowAllProjects] = useState(false);

  const renderProjectCard = (
    project: ProjectData,
    index: number,
    isFaded: boolean = false,
  ) => (
    <div
      key={project._id}
      className={`relative ${isFaded && !showAllProjects ? `fade-project` : ""}`}
    >
      <Card className="overflow-hidden">
        <Image
          src={`/images/projects/optimized/${project.image.split("/")[2]}.webp`}
          alt={`${project.title} - ${project.description}`}
          width={800}
          height={400}
          className="h-48 w-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={85}
          priority={false}
        />
        <CardHeader>
          <CardTitle>
            <h3>{project.title}</h3>
          </CardTitle>
          <CardDescription>{project.description}</CardDescription>
          {project.technologies && project.technologies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {project.technologies.map((tech, techIndex) => (
                <span
                  key={techIndex}
                  className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </CardHeader>
        <CardFooter>
          <Button className="w-full">Zobrazit projekt</Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <>
      {/* Hlavní projekty */}
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {featuredProjects.map((project, index) =>
          renderProjectCard(project, index),
        )}
      </div>

      {/* Fade-out projekty */}
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {fadeProjects.map((project, index) =>
          renderProjectCard(project, index, true),
        )}
      </div>

      {/* Ostatní projekty - zobrazí se pouze při showAllProjects */}
      {showAllProjects && otherProjects.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {otherProjects.map((project: ProjectData, index: number) =>
            renderProjectCard(project, index),
          )}
        </div>
      )}

      {/* Akční tlačítko */}
      <div className="text-center">
        <Button
          size="lg"
          className="bg-[#32e6f0] px-8 py-3 font-semibold text-[#120e22] hover:bg-[#32d6e6]"
          onClick={() => setShowAllProjects(!showAllProjects)}
        >
          {showAllProjects ? "Skrýt projekty" : "Zobrazit všechny projekty"}
        </Button>
      </div>
    </>
  );
}
