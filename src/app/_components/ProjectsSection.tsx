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
    title: "2MSKV",
    description: "Webové stránky sdružení 9 mateřských školek",
    image: "/Reference/2MSKV/main-nahled.jpg",
    order: 10,
  },
  {
    id: 2,
    title: "Astos",
    description: "Moderní web pro podnikání v oblasti technologií",
    image: "/Reference/Astos/astos-nahled.jpg",
    order: 11,
  },
  {
    id: 3,
    title: "BMP",
    description: "Firemní webová stránka s moderním designem",
    image: "/Reference/BMP/bmp-hmpg-screen-nahled.jpg",
    order: 12,
  },
  {
    id: 4,
    title: "Firemní balíček",
    description: "Komplexní řešení pro firemní prezentaci",
    image: "/Reference/FiremniBalicek/firemnibalicek.png",
    order: 13,
  },
  {
    id: 5,
    title: "Fitness Ural",
    description: "Webové stránky pro fitness centrum s rezervačním systémem",
    image: "/Reference/FitnessUral/fitness-ural-nahled.jpg",
    order: 3,
  },
  {
    id: 6,
    title: "František Slovák",
    description: "Osobní webová prezentace s portfoliem",
    image: "/Reference/FrantisekSlovak/frantisekslovak-com-nahled.jpg",
    order: 14,
  },
  {
    id: 7,
    title: "Geowestmaster",
    description: "Specializovaný web pro geodetické služby",
    image: "/Reference/Geowestmaster/geowestmaster-nahled.jpg",
    order: 15,
  },
  {
    id: 8,
    title: "GP Rooms",
    description: "Rezervační systém pro ubytovací zařízení",
    image: "/Reference/Gprooms/gprooms-new-nahled.jpg",
    order: 16,
  },
  {
    id: 9,
    title: "GP Tents",
    description: "E-shop se stany a outdoorovým vybavením",
    image: "/Reference/GPtents/gptents-nahled.jpg",
    order: 17,
  },
  {
    id: 10,
    title: "Hostel Loket",
    description: "Webové stránky hostelu s rezervačním systémem",
    image: "/Reference/HostelLoket/2022-11-01_204649-nahled.jpg",
    order: 18,
  },
  {
    id: 11,
    title: "Kanya Kage",
    description: "Webová prezentace uměleckého projektu",
    image: "/Reference/KanyKage/2022-11-01_204741-nahled.jpg",
    order: 19,
  },
  {
    id: 12,
    title: "Kotelna 55",
    description: "Minimalistická webová prezentace",
    image: "/Reference/kotelna55/kotelna55-nahled.jpg",
    order: 20,
  },
  {
    id: 13,
    title: "Markop Okna",
    description: "Webové stránky pro výrobu a montáž oken",
    image: "/Reference/MarkopOkna/markopokna-1024x528-nahled.jpg",
    order: 21,
  },
  {
    id: 14,
    title: "Penzion Loket",
    description: "Webové stránky penzionu s rezervačním systémem",
    image: "/Reference/PenzionLoket/penzionloket-1024x732-nahled.jpg",
    order: 22,
  },
  {
    id: 15,
    title: "Plenkový servis",
    description: "Web pro služby spojené s péčí o děti",
    image: "/Reference/PlenkovyServis/2015-09-25_134545-1024x709-nahled.jpg",
    order: 23,
  },
  {
    id: 16,
    title: "Recysmach",
    description: "Webová prezentace recyklační společnosti",
    image: "/Reference/Recysmach/2015-06-25_161106-1024x546-nahled.jpg",
    order: 24,
  },
  {
    id: 17,
    title: "Rybar Transport",
    description: "Webové stránky dopravní společnosti",
    image: "/Reference/RybarTransport/rybar-1024x512-nahled.jpg",
    order: 25,
  },
  {
    id: 18,
    title: "Skripta Prokop",
    description: "E-learning platforma s prodejním systémem",
    image: "/Reference/SkriptaProkop/skriptaprokop-1024x546-nahled.jpg",
    order: 26,
  },
  {
    id: 19,
    title: "Sokolov Ubytování",
    description: "Rezervační systém pro ubytování v Sokolově",
    image: "/Reference/SokolovUbytovani/2022-11-01_204611-nahled.jpg",
    order: 27,
  },
  {
    id: 20,
    title: "Sunpoint",
    description: "Moderní webová aplikace s responsivním designem",
    image: "/Reference/Sunpoint/sunpoint-screen-1024x723-nahled.jpg",
    order: 28,
  },
  {
    id: 21,
    title: "Tepp",
    description: "Inovativní webová platforma",
    image: "/Reference/Tepp/tepp.png",
    order: 1,
  },
  {
    id: 22,
    title: "Unlikely",
    description: "Kreativní webový projekt s unikátním designem",
    image: "/Reference/Unlikely/unlikely.png",
    order: 2,
  },
  {
    id: 23,
    title: "Výroba šperků",
    description: "E-shop a prezentace výroby šperků na míru",
    image: "/Reference/VyrobaSperku/2022-11-01_204918-nahled.jpg",
    order: 29,
  },
];

export function ProjectsSection() {
  // Seřadíme projekty podle order pole
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order);

  return (
    <section id="projects" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl font-bold">Moje projekty</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <Image
                src={project.image}
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
