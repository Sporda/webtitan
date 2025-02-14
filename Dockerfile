# Stage 1: Závislosti a build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalace pnpm a potřebných závislostí pro build
RUN apk add --no-cache libc6-compat python3 make g++
RUN npm install -g pnpm

# Nastavení build argumentů
ARG DATABASE_URL
ARG NEXT_PUBLIC_URL

# Nastavení env proměnných pro build
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}

# Kopírování package.json a package-lock.json
COPY package*.json pnpm-lock.yaml ./

# Instalace závislostí
RUN pnpm install --ignore-scripts
RUN pnpm rebuild libsql

# Kopírování zdrojových souborů
COPY . .

# Build aplikace
RUN pnpm build

# Stage 2: Produkční obraz
FROM node:20-alpine AS runner

WORKDIR /app

# Instalace potřebných závislostí pro runtime
RUN apk add --no-cache libc6-compat

# Nastavení produkčního módu
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Kopírování potřebných souborů z builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules

# Nastavení uživatele pro lepší bezpečnost
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Nastavení proměnných pro správné fungování
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Spuštění aplikace
CMD ["node", "server.js"] 