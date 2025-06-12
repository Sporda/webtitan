// Načtení .env souboru MUSÍ být první!
import * as dotenv from "dotenv";
dotenv.config();

// Pro skripty přeskočíme validaci env proměnných
process.env.SKIP_ENV_VALIDATION = "true";

import connectToMongoDB from "../src/server/db/mongoose";
import Project from "../src/server/db/models/Project";

const projects = [
  {
    title: "2MSKV",
    description: "Webové stránky sdružení 9 mateřských školek",
    image: "/Reference/2MSKV/main-nahled.jpg",
    order: 10,
    category: "web",
    featured: false,
  },
  {
    title: "Astos",
    description: "Moderní web pro podnikání v oblasti technologií",
    image: "/Reference/Astos/astos-nahled.jpg",
    order: 11,
    category: "web",
    featured: false,
  },
  {
    title: "BMP",
    description: "Firemní webová stránka s moderním designem",
    image: "/Reference/BMP/bmp-hmpg-screen-nahled.jpg",
    order: 12,
    category: "web",
    featured: false,
  },
  {
    title: "Firemní balíček",
    description: "Komplexní řešení pro firemní prezentaci",
    image: "/Reference/FiremniBalicek/firemnibalicek.png",
    order: 13,
    category: "prezentace",
    featured: false,
  },
  {
    title: "Fitness Ural",
    description: "Webové stránky pro fitness centrum s rezervačním systémem",
    image: "/Reference/FitnessUral/fitness-ural-nahled.jpg",
    order: 3,
    category: "rezervace",
    featured: true,
    technologies: ["Next.js", "TypeScript", "Rezervační systém"],
  },
  {
    title: "František Slovák",
    description: "Osobní webová prezentace s portfoliem",
    image: "/Reference/FrantisekSlovak/frantisekslovak-com-nahled.jpg",
    order: 14,
    category: "prezentace",
    featured: false,
  },
  {
    title: "Geowestmaster",
    description: "Specializovaný web pro geodetické služby",
    image: "/Reference/Geowestmaster/geowestmaster-nahled.jpg",
    order: 15,
    category: "web",
    featured: false,
  },
  {
    title: "GP Rooms",
    description: "Rezervační systém pro ubytovací zařízení",
    image: "/Reference/Gprooms/gprooms-new-nahled.jpg",
    order: 16,
    category: "rezervace",
    featured: true,
    technologies: ["React", "Node.js", "Rezervace", "Platby"],
  },
  {
    title: "GP Tents",
    description: "E-shop se stany a outdoorovým vybavením",
    image: "/Reference/GPtents/gptents-nahled.jpg",
    order: 17,
    category: "e-shop",
    featured: false,
    technologies: ["E-commerce", "Platební brána", "Skladování"],
  },
  {
    title: "Hostel Loket",
    description: "Webové stránky hostelu s rezervačním systémem",
    image: "/Reference/HostelLoket/2022-11-01_204649-nahled.jpg",
    order: 18,
    category: "rezervace",
    featured: false,
  },
  {
    title: "Kanya Kage",
    description: "Webová prezentace uměleckého projektu",
    image: "/Reference/KanyKage/2022-11-01_204741-nahled.jpg",
    order: 19,
    category: "prezentace",
    featured: false,
  },
  {
    title: "Kotelna 55",
    description: "Minimalistická webová prezentace",
    image: "/Reference/kotelna55/kotelna55-nahled.jpg",
    order: 20,
    category: "prezentace",
    featured: false,
  },
  {
    title: "Markop Okna",
    description: "Webové stránky pro výrobu a montáž oken",
    image: "/Reference/MarkopOkna/markopokna-1024x528-nahled.jpg",
    order: 21,
    category: "web",
    featured: false,
  },
  {
    title: "Penzion Loket",
    description: "Webové stránky penzionu s rezervačním systémem",
    image: "/Reference/PenzionLoket/penzionloket-1024x732-nahled.jpg",
    order: 22,
    category: "rezervace",
    featured: false,
  },
  {
    title: "Plenkový servis",
    description: "Web pro služby spojené s péčí o děti",
    image: "/Reference/PlenkovyServis/2015-09-25_134545-1024x709-nahled.jpg",
    order: 23,
    category: "web",
    featured: false,
  },
  {
    title: "Recysmach",
    description: "Webová prezentace recyklační společnosti",
    image: "/Reference/Recysmach/2015-06-25_161106-1024x546-nahled.jpg",
    order: 24,
    category: "prezentace",
    featured: false,
  },
  {
    title: "Rybar Transport",
    description: "Webové stránky dopravní společnosti",
    image: "/Reference/RybarTransport/rybar-1024x512-nahled.jpg",
    order: 25,
    category: "web",
    featured: false,
  },
  {
    title: "Skripta Prokop",
    description: "E-learning platforma s prodejním systémem",
    image: "/Reference/SkriptaProkop/skriptaprokop-1024x546-nahled.jpg",
    order: 26,
    category: "aplikace",
    featured: true,
    technologies: ["E-learning", "Platby", "Uživatelské účty"],
  },
  {
    title: "Sokolov Ubytování",
    description: "Rezervační systém pro ubytování v Sokolově",
    image: "/Reference/SokolovUbytovani/2022-11-01_204611-nahled.jpg",
    order: 27,
    category: "rezervace",
    featured: false,
  },
  {
    title: "Sunpoint",
    description: "Moderní webová aplikace s responsivním designem",
    image: "/Reference/Sunpoint/sunpoint-screen-1024x723-nahled.jpg",
    order: 28,
    category: "aplikace",
    featured: false,
  },
  {
    title: "Tepp",
    description: "Inovativní webová platforma",
    image: "/Reference/Tepp/tepp.png",
    order: 1,
    category: "aplikace",
    featured: true,
    technologies: ["Next.js", "MongoDB", "Real-time"],
  },
  {
    title: "Unlikely",
    description: "Kreativní webový projekt s unikátním designem",
    image: "/Reference/Unlikely/unlikely.png",
    order: 2,
    category: "prezentace",
    featured: true,
    technologies: ["GSAP", "Animace", "Creative"],
  },
  {
    title: "Výroba šperků",
    description: "E-shop a prezentace výroby šperků na míru",
    image: "/Reference/VyrobaSperku/2022-11-01_204918-nahled.jpg",
    order: 29,
    category: "e-shop",
    featured: false,
    technologies: ["E-commerce", "Galerie", "Formuláře"],
  },
];

async function importProjects() {
  try {
    console.log("🔗 Připojování k MongoDB...");
    await connectToMongoDB();

    // Ověření správné databáze
    const mongoose = await import("mongoose");
    const dbName = mongoose.default.connection.db?.databaseName;
    console.log(`📂 Používáme databázi: "${dbName}"`);

    if (dbName !== "webtitan") {
      console.error(
        `❌ CHYBA: Připojeno k databázi "${dbName}" místo "webtitan"`,
      );
      console.error("💡 Zkontrolujte MONGODB_URI v .env souboru");
      process.exit(1);
    }

    console.log("🗑️ Mazání existujících projektů...");
    await (Project as any).deleteMany({});

    console.log("📦 Importování nových projektů...");
    const result = await (Project as any).insertMany(projects);

    console.log(`✅ Úspěšně importováno ${result.length} projektů!`);

    // Zobrazení statistik
    const stats = await Project.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          featured: {
            $sum: { $cond: ["$featured", 1, 0] },
          },
        },
      },
    ]);

    console.log("\n📊 Statistiky projektů:");
    stats.forEach((stat) => {
      console.log(
        `   ${stat._id}: ${stat.count} projektů (${stat.featured} zvýrazněných)`,
      );
    });

    const totalFeatured = await Project.countDocuments({ featured: true });
    console.log(`\n⭐ Celkem zvýrazněných projektů: ${totalFeatured}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Chyba při importu projektů:", error);
    process.exit(1);
  }
}

importProjects();
