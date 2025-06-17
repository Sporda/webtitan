import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, "../public/Reference");
const outputDir = path.join(__dirname, "../public/images/projects/optimized");

async function optimizeImages() {
  try {
    // Vytvoříme výstupní adresář, pokud neexistuje
    await fs.mkdir(outputDir, { recursive: true });

    // Načteme všechny složky projektů
    const projectFolders = await fs.readdir(inputDir);

    for (const folder of projectFolders) {
      const projectPath = path.join(inputDir, folder);
      const stats = await fs.stat(projectPath);

      if (stats.isDirectory()) {
        // Načteme všechny soubory v projektu
        const files = await fs.readdir(projectPath);

        for (const file of files) {
          if (file.match(/\.(jpg|jpeg|png)$/i)) {
            const inputPath = path.join(projectPath, file);
            // Použijeme název složky projektu jako název souboru
            const outputPath = path.join(outputDir, `${folder}.webp`);

            console.log(`Zpracovávám: ${folder}/${file}`);

            // Zpracujeme obrázek
            await sharp(inputPath)
              .resize(800, 400, {
                fit: "cover",
                position: "center",
              })
              .webp({
                quality: 80,
                effort: 6, // Vyšší hodnota = lepší komprese, ale pomalejší zpracování
              })
              .toFile(outputPath);

            console.log(`✅ Vytvořen: ${path.basename(outputPath)}`);
          }
        }
      }
    }

    console.log("\n🎉 Optimalizace dokončena!");
  } catch (error) {
    console.error("❌ Chyba při optimalizaci:", error);
  }
}

optimizeImages();
