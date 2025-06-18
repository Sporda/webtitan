import React from "react";

interface CareerItem {
  position: string;
  company: string;
  period: string;
  location: string;
  description: string;
  technologies: string[];
}

export const CareerSection = () => {
  const careerData: CareerItem[] = [
    {
      position: "Full-stack JavaScript vývojář a správce serverů",
      company: "Šikmo s.r.o. / Živnostník",
      period: "září 2023 – současnost · 1 rok 10 měsíců",
      location: "Nademlejnská 651/7, Praha 9 · Hybridní",
      description:
        "Full-stack vývoj webových aplikací a správa serverového prostředí.",
      technologies: [
        "JavaScript",
        "Next.js",
        "React",
        "Node.js",
        "TypeScript",
        "MongoDB",
        "Docker",
      ],
    },
    {
      position: "Specialista IT sítě",
      company: "VUJO s.r.o.",
      period: "březen 2017 – září 2023 · 6 let 7 měsíců",
      location: "Sokolov, Karlovarský, Česko · Na místě",
      description:
        "Full-stack programátor a system administrator. IT Specialista. Web developer.",
      technologies: [
        "Python",
        "WordPress",
        "PHP",
        "MySQL",
        "Linux",
        "Networking",
        "System Administration",
      ],
    },
    {
      position: "IT / Manager",
      company: "DISTRACT s.r.o.",
      period: "květen 2010 – 2015 · 4 roky 9 měsíců",
      location: "Plzeň-město, Plzeňský, Česko",
      description:
        "Převážně tvorba animací pro velkoplošné LED obrazovky v programu Adobe After Effects. Správa firemní sítě a oprava softwarových závad. Tvorba webových aplikací HTML, CSS, JavaScript, PHP, MySQL.",
      technologies: [
        "Adobe After Effects",
        "HTML",
        "CSS",
        "JavaScript",
        "PHP",
        "MySQL",
        "Network Management",
      ],
    },
    {
      position: "Webmaster",
      company: "Humdrum s.r.o",
      period: "únor 2006 – květen 2010 · 4 roky 4 měsíce",
      location: "Česká republika",
      description: "Vývoj webových stránek a implementace jQuery funkcionalit.",
      technologies: ["HTML", "CSS", "JavaScript", "jQuery", "Web Development"],
    },
    {
      position: "Html a CSS kodování",
      company: "Estetica s.r.o.",
      period: "září 2007 – duben 2008 · 8 měsíců",
      location: "Plzen",
      description: "Pomocné práce při korektuře a tvorbě HTML a CSS šablon.",
      technologies: ["HTML", "CSS", "Web Development", "Git"],
    },
  ];

  return (
    <section id="career" className="relative z-[4] py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold text-white drop-shadow-lg">
          Kariéra
        </h2>

        <div className="relative mx-auto max-w-6xl">
          {/* Vertikální čára */}
          <div className="absolute left-1/2 h-full w-1 -translate-x-1/2 transform bg-gradient-to-b from-[#32e6f0] to-[#221d42]"></div>

          {careerData.map((item, index) => (
            <div
              key={index}
              className={`relative mb-16 ${
                index % 2 === 0 ? "md:flex-row-reverse" : ""
              } flex flex-col items-center md:flex-row`}
            >
              {/* Číslo/bod na timeline */}
              <div className="absolute left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-4 transform items-center justify-center rounded-full border-4 border-[#221d42] bg-[#32e6f0]">
                <span className="text-sm font-bold text-[#221d42]">
                  {index + 1}
                </span>
              </div>

              {/* Obsah karty */}
              <div
                className={`w-full md:w-5/12 ${
                  index % 2 === 0
                    ? "md:mr-auto md:text-right"
                    : "md:ml-auto md:text-left"
                } mt-8 md:mt-0`}
              >
                <div className="rounded-xl border border-[#32e6f0]/20 bg-[rgba(18,16,23,0.9)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-[10px]">
                  <h3 className="mb-2 text-xl font-bold text-white">
                    {item.position}
                  </h3>
                  <h4 className="mb-2 font-semibold text-[#32e6f0]">
                    {item.company}
                  </h4>
                  <p className="mb-2 text-sm text-white/70">{item.period}</p>
                  <p className="mb-4 text-sm text-white/60">{item.location}</p>
                  <p className="mb-4 text-sm leading-relaxed text-white/90">
                    {item.description}
                  </p>

                  {/* Technologie */}
                  <div className="flex flex-wrap gap-2">
                    {item.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="rounded-full border border-[#32e6f0]/30 bg-[#32e6f0]/20 px-3 py-1 text-xs text-[#32e6f0]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
