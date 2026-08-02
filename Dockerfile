# ============================================================
# Manhal Academy — Next.js app image (multi-stage)
# Builds the production Next.js build and runs it with `next start`
# on port 3000 (behind the Caddy proxy, which also routes the
# socket.io classroom traffic to the `socket` service on :3003).
#
# Build:  docker compose build
# Run:    docker compose up -d
# ============================================================

# ---------- Build stage ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the whole project (source, prisma schema, public, db seed)
COPY . .

# Generate the Prisma client, then build Next.js (standalone output)
RUN npx prisma generate
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies only (includes `prisma` CLI + @prisma/client)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Regenerate Prisma client inside the runtime node_modules
RUN npx prisma generate

# Copy the build output + static assets + public files + prisma (schema & seed db)
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/next.config.ts ./next.config.ts

# Entrypoint: seed the SQLite DB on first boot, sync the schema, then start
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
