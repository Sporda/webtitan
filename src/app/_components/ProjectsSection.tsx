import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const projects = [
  {
    id: 1,
    title: "Project 1",
    description: "A brief description of the project",
    image: "/placeholder.svg",
  },
  {
    id: 2,
    title: "Project 2",
    description: "Another exciting project",
    image: "/placeholder.svg",
  },
  {
    id: 3,
    title: "Project 3",
    description: "An innovative web application",
    image: "/placeholder.svg",
  },
];

export function ProjectsSection() {
  return (
    <section id="projects" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl font-bold">Moje projekty</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <Image
                src={project.image || "/placeholder.svg"}
                alt={project.title}
                width={400}
                height={200}
                className="h-48 w-full object-cover"
              />
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button className="w-full">Zobrazit projekt</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
