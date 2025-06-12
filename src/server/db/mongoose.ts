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

// Přímo používáme process.env.MONGODB_URI pro vyhnutí se problémům s env.js na serveru
const MONGODB_URI = process.env.MONGODB_URI;

// Zkontrolujeme pouze pokud to není build proces
function checkMongoDBURI() {
  // Debug informace pro server
  console.log("🔍 Debug MongoDB URI:");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
  console.log(
    `   Environment keys containing MONGO: ${Object.keys(process.env).filter((key) => key.includes("MONGO"))}`,
  );

  if (!MONGODB_URI) {
    console.error("❌ CHYBA: MONGODB_URI není nastavené!");
    console.error(
      "💡 Zkontrolujte Environment Variables v deployment nastavení!",
    );
    console.error(
      "💡 Pro GitHub Pages: Settings > Environments > main > Environment variables",
    );
    throw new Error("Chybí MONGODB_URI v environment variables");
  }
  return MONGODB_URI;
}

// Ověření URI pouze pokud je dostupné
if (MONGODB_URI) {
  if (
    !MONGODB_URI.endsWith("/webtitan") &&
    !MONGODB_URI.includes("dbName=webtitan")
  ) {
    console.warn(`⚠️  POZOR: MONGODB_URI nespecifikuje databázi "webtitan"`);
    console.warn(`   Aktuální URI: ${MONGODB_URI}`);
    console.warn(`   Doporučené: mongodb://localhost:27017/webtitan`);
  }
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
    // Zkontrolujeme URI při pokusu o připojení
    const uri = checkMongoDBURI();

    const opts = {
      bufferCommands: false,
      dbName: "webtitan", // EXPLICITNÍ nastavení databáze
    };

    cached!.promise = mongoose.connect(uri, opts).then((mongoose) => {
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
