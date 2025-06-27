import { config } from "dotenv";
import connectToMongoDB from "../src/server/db/mongoose";
import Admin from "../src/server/db/models/Admin";

// Načíst environment proměnné
config({ path: ".env" });

async function createFirstAdmin() {
  try {
    await connectToMongoDB();

    // Zkontrolovat, zda už existuje nějaký admin
    const existingAdmin = await Admin.findOne();

    if (existingAdmin) {
      console.log("❌ Admin už existuje!");
      console.log(`Existující admin: ${existingAdmin.username}`);
      process.exit(1);
    }

    // Získat přihlašovací údaje z command line argumentů nebo použít defaultní
    const username = process.argv[2] || "admin";
    const password = process.argv[3] || "admin123";
    const email = process.argv[4] || undefined;

    // Vytvořit admin uživatele
    const admin = new Admin({
      username,
      password,
      email,
      isActive: true,
    });

    await admin.save();

    console.log("✅ Admin úspěšně vytvořen!");
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email || "Neuvedeno"}`);
    console.log(`ID: ${admin._id}`);
    console.log("\n🔐 Můžete se nyní přihlásit na /admin");
  } catch (error) {
    console.error("❌ Chyba při vytváření admina:", error);
  } finally {
    process.exit(0);
  }
}

// Spustit pouze pokud je skript volán přímo
if (import.meta.url === `file://${process.argv[1]}`) {
  createFirstAdmin();
}

export default createFirstAdmin;
