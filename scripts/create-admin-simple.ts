import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Interface pro Admin
interface IAdmin {
  username: string;
  password: string;
  email?: string;
  isActive: boolean;
}

// Schéma pro Admin
const AdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Hash heslo před uložením
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

const Admin =
  mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);

async function createFirstAdmin() {
  try {
    // Získat MONGODB_URI z environment proměnných
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error("❌ MONGODB_URI není nastavené v environment proměnných!");
      console.log("💡 Zkontrolujte .env soubor nebo nastavte MONGODB_URI");
      process.exit(1);
    }

    // Připojit k MongoDB
    await mongoose.connect(mongoUri);
    console.log("✅ Připojeno k MongoDB");

    // Zkontrolovat, zda už existuje nějaký admin
    const existingAdmin = await (Admin as any).findOne({});

    if (existingAdmin) {
      console.log("❌ Admin už existuje!");
      console.log(`Existující admin: ${existingAdmin.username}`);
      process.exit(1);
    }

    // Získat přihlašovací údaje z command line argumentů
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
    console.log(`\n📍 Databáze: ${mongoose.connection.db?.databaseName}`);
    console.log(`📍 Kolekce: admins`);
    console.log("\n🔐 Můžete se nyní přihlásit na /admin");
  } catch (error) {
    console.error("❌ Chyba při vytváření admina:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createFirstAdmin();
