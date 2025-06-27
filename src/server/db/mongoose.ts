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
  if (!process.env.MONGODB_URI) {
    // Debug info pouze v development
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Debug MongoDB URI:");
      console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`   MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
      console.log(
        `   První 20 znaků: ${process.env.MONGODB_URI?.substring(0, 20) || "N/A"}...`,
      );
    }

    console.error("❌ CHYBA: MONGODB_URI není nastavené!");
    console.error(
      "💡 Nastavte MONGODB_URI environment proměnnou v .env souboru",
    );
    console.error(
      "💡 Příklad: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname",
    );

    throw new Error("MONGODB_URI environment proměnná není nastavená");
  }
  return process.env.MONGODB_URI;
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

      // Log pouze v development
      if (process.env.NODE_ENV === "development") {
        console.log(`✅ MongoDB připojeno k databázi: "${dbName}"`);
      }
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
