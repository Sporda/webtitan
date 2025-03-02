"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { ReactIcon } from "@/components/icons/ReactIcon";
import { NextIcon } from "@/components/icons/NextIcon";
import { MongoIcon } from "@/components/icons/MongoIcon";
import { NestIcon } from "@/components/icons/NestIcon";
import { GraphqlIcon } from "@/components/icons/GraphqlIcon";
import { DockerIcon } from "@/components/icons/DockerIcon";
import { TrpcIcon } from "@/components/icons/TrpcIcon";
import { GitlabIcon } from "@/components/icons/GitlabIcon";
import { HtmlIcon } from "@/components/icons/HtmlIcon";
import { CssIcon } from "@/components/icons/CssIcon";
import { JavascriptIcon } from "@/components/icons/JavascriptIcon";
import { TypescriptIcon } from "@/components/icons/TypescriptIcon";
import { PhpIcon } from "@/components/icons/PhpIcon";
import { MysqlIcon } from "@/components/icons/MysqlIcon";
import { WordpressIcon } from "@/components/icons/WordpressIcon";
import { LinuxIcon } from "@/components/icons/LinuxIcon";
import { JestIcon } from "@/components/icons/JestIcon";
import "@/styles/skillsSection.css";

const technologies = [
  { name: "React", icon: ReactIcon },
  { name: "TypeScript", icon: TypescriptIcon },
  { name: "Next.js", icon: NextIcon },
  { name: "MongoDB", icon: MongoIcon },
  { name: "Nest.js", icon: NestIcon },
  { name: "GraphQL", icon: GraphqlIcon },
  { name: "Docker", icon: DockerIcon },
  { name: "Linux", icon: LinuxIcon },
  { name: "tRPC", icon: TrpcIcon },
  { name: "GitLab", icon: GitlabIcon },
  { name: "Jest", icon: JestIcon },
  { name: "HTML", icon: HtmlIcon },
  { name: "CSS", icon: CssIcon },
  { name: "JavaScript", icon: JavascriptIcon },
  { name: "PHP", icon: PhpIcon },
  { name: "MySQL", icon: MysqlIcon },
  { name: "WordPress", icon: WordpressIcon },
];

export function SkillsSection() {
  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));

  return (
    <section id="skills" className="bg-transparent">
      <h2 className="mb-12 text-center text-3xl font-bold">
        Technologie, které používám
      </h2>
      <Carousel
        opts={{
          align: "start",
          loop: true,
          slidesToScroll: 1,
        }}
        plugins={[plugin.current]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {technologies.map((tech) => (
            <CarouselItem
              key={tech.name}
              className="basis-1/2 pl-2 md:basis-1/3 md:pl-4 lg:basis-1/6"
            >
              <div className="flex flex-col items-center">
                {tech.icon && <tech.icon size={60} className="mb-2" />}
                <span>{tech.name}</span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}
