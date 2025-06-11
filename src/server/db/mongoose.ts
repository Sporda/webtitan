import mongoose from "mongoose";

// Pro skripty - načtení .env pokud není načtený
if (!process.env.MONGODB_URI && !process.env.VERCEL) {
  try {
    require("dotenv").config();
  } catch (e) {
    // dotenv není dostupné, pokračujeme
  }
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ CHYBA: MONGODB_URI není nastavené!");
  console.error("💡 Ujistěte se, že máte v .env souboru:");
  console.error('   MONGODB_URI="mongodb://localhost:27017/webtitan"');
  throw new Error("Chybí MONGODB_URI v environment variables");
}

// Ověření, že URI končí správnou databází
if (
  !MONGODB_URI.endsWith("/webtitan") &&
  !MONGODB_URI.includes("dbName=webtitan")
) {
  console.warn(`⚠️  POZOR: MONGODB_URI nespecifikuje databázi "webtitan"`);
  console.warn(`   Aktuální URI: ${MONGODB_URI}`);
  console.warn(`   Doporučené: mongodb://localhost:27017/webtitan`);
}

let cached = global.mongooseConnection;

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

async function connectToMongoDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      dbName: "webtitan", // EXPLICITNÍ nastavení databáze
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      // Ověření, že používáme správnou databázi
      const dbName = mongoose.connection.db?.databaseName;
      if (dbName !== "webtitan") {
        throw new Error(
          `Připojeno k nesprávné databázi: "${dbName}" místo "webtitan"`,
        );
      }
      console.log(`✅ MongoDB připojeno k databázi: "${dbName}"`);
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectToMongoDB;
