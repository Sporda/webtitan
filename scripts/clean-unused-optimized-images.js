import { promises as fs } from "fs";
import path from "path";

// Získáme pole projects z import-projects.ts (ručně zkopírujeme jen pole projects)
const projects = [
  { image: "/Reference/2MSKV/main-nahled.jpg" },
  { image: "/Reference/Astos/astos-nahled.jpg" },
  { image: "/Reference/BMP/bmp-hmpg-screen-nahled.jpg" },
  { image: "/Reference/FiremniBalicek/firemnibalicek.png" },
  { image: "/Reference/FitnessUral/fitness-ural-nahled.jpg" },
  { image: "/Reference/FrantisekSlovak/frantisekslovak-com-nahled.jpg" },
  { image: "/Reference/Geowestmaster/geowestmaster-nahled.jpg" },
  { image: "/Reference/Gprooms/gprooms-new-nahled.jpg" },
  { image: "/Reference/GPtents/gptents-nahled.jpg" },
  { image: "/Reference/HostelLoket/2022-11-01_204649-nahled.jpg" },
  { image: "/Reference/KanyKage/2022-11-01_204741-nahled.jpg" },
  { image: "/Reference/kotelna55/kotelna55-nahled.jpg" },
  { image: "/Reference/MarkopOkna/markopokna-1024x528-nahled.jpg" },
  { image: "/Reference/PenzionLoket/penzionloket-1024x732-nahled.jpg" },
  { image: "/Reference/PlenkovyServis/2015-09-25_134545-1024x709-nahled.jpg" },
  { image: "/Reference/Recysmach/2015-06-25_161106-1024x546-nahled.jpg" },
  { image: "/Reference/RybarTransport/rybar-1024x512-nahled.jpg" },
  { image: "/Reference/SkriptaProkop/skriptaprokop-1024x546-nahled.jpg" },
  { image: "/Reference/SokolovUbytovani/2022-11-01_204611-nahled.jpg" },
  { image: "/Reference/Sunpoint/sunpoint-screen-1024x723-nahled.jpg" },
  { image: "/Reference/Tepp/tepp.png" },
  { image: "/Reference/Unlikely/unlikely.png" },
  { image: "/Reference/VyrobaSperku/2022-11-01_204918-nahled.jpg" },
];

const optimizedDir = path.join(
  process.cwd(),
  "public/images/projects/optimized",
);

async function cleanUnusedImages() {
  const used = new Set(projects.map((p) => p.image.split("/")[2] + ".webp"));
  const files = await fs.readdir(optimizedDir);
  for (const file of files) {
    if (!used.has(file)) {
      await fs.unlink(path.join(optimizedDir, file));
      console.log("Smazán nepoužívaný obrázek:", file);
    }
  }
  console.log("Hotovo!");
}

cleanUnusedImages();
