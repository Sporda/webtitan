import mongoose from "mongoose";
import * as dotenv from "dotenv";

// Načtení environment proměnných
dotenv.config();

async function testMongoConnection() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI není nastavené v .env souboru");
    process.exit(1);
  }

  console.log("🔗 Testování MongoDB připojení...");
  console.log(`📍 URI: ${MONGODB_URI.replace(/\/\/.*:.*@/, "//***:***@")}`); // Skrytí hesla

  try {
    // Připojení k MongoDB
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    console.log("✅ Připojení úspěšné!");

    // Ověření názvu databáze
    const dbName = mongoose.connection.db?.databaseName;
    console.log(`📂 Aktuální databáze: "${dbName}"`);

    if (dbName !== "webtitan") {
      console.warn(
        `⚠️  POZOR: Používá se databáze "${dbName}" místo "webtitan"`,
      );
      console.log(
        "💡 Pro správnou databázi použijte URI: mongodb://localhost:27017/webtitan",
      );
    } else {
      console.log('✅ Správná databáze "webtitan" je používána');
    }

    // Test vytvoření kolekce
    console.log("\n🧪 Testování kolekce...");
    const collections = await mongoose.connection.db
      ?.listCollections()
      .toArray();
    console.log(`📋 Existující kolekce (${collections?.length || 0}):`);

    if (collections && collections.length > 0) {
      collections.forEach((col) => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log("   (žádné kolekce zatím neexistují)");
    }

    // Test write operace
    console.log("\n✍️  Testování write operace...");
    const testCollection =
      mongoose.connection.db?.collection("test_connection");
    const testDoc = await testCollection?.insertOne({
      test: true,
      timestamp: new Date(),
      message: "Test připojení z WebTitan",
    });

    if (testDoc?.insertedId) {
      console.log("✅ Write operace úspěšná");

      // Smazání test dokumentu
      await testCollection?.deleteOne({ _id: testDoc.insertedId });
      console.log("🧹 Test dokument smazán");
    }

    // Zobrazení MongoDB verze
    const adminDb = mongoose.connection.db?.admin();
    const serverStatus = await adminDb?.serverStatus();
    console.log(`\n🔧 MongoDB verze: ${serverStatus?.version}`);

    console.log("\n🎉 Všechny testy prošly úspěšně!");
  } catch (error) {
    console.error("❌ Chyba při připojení k MongoDB:");
    console.error(error);

    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        console.log("\n💡 Řešení:");
        console.log("1. Ujistěte se, že MongoDB běží:");
        console.log(
          "   docker run -d --name mongodb -p 27017:27017 mongo:latest",
        );
        console.log("2. Nebo zkontrolujte, že MongoDB služba je spuštěná");
      }
    }

    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Odpojeno od MongoDB");
  }
}

// Spuštění testu
testMongoConnection();
