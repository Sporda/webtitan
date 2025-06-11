# MongoDB Setup pro WebTitan

## 🚀 Rychlý start

### 1. Konfigurace environment proměnných

Do vašeho `.env` souboru přidejte:

```bash
# MongoDB připojení
MONGODB_URI="mongodb://localhost:27017/webtitan"

# Existující SQLite databáze (můžete ponechat)
DATABASE_URL="file:./dev.db"
```

### 2. Spuštění MongoDB lokálně

```bash
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

### 3. Import projektů

```bash
pnpm run import:projects
```

### 4. Spuštění aplikace

```bash
pnpm dev
```

## 📁 Struktura

**Backend:**

- `/src/server/db/mongoose.ts` - MongoDB připojení
- `/src/server/db/models/Project.ts` - Mongoose model
- `/src/server/api/routers/project.ts` - tRPC API

**Frontend:**

- `/src/app/_components/ProjectsSection.tsx` - React komponenta

## 🔌 API

```typescript
// Získání všech projektů
const projects = await api.project.getAll.query();

// Filtrování
const featured = await api.project.getAll.query({ featured: true });
const webProjects = await api.project.getAll.query({ category: "web" });
```
