# FILE: apps/web/Dockerfile
# Next.js 15 (CornMafia Web) — multi-stage build with non-root runtime

# --- Build stage ---
FROM node:22.17.0-alpine AS build
ENV CI=1 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Install deps (dev deps included so Prisma/Next build works)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --ignore-scripts; else npm install --no-audit --ignore-scripts; fi

# Copy source
COPY . .

# ---- Map libraries + types installed INSIDE the image (no host install) ----
# Pin to existing versions and include TypeScript types for Leaflet.
RUN npm pkg set dependencies.leaflet="^1.9.4" \
 && npm pkg set dependencies.react-leaflet="^4.2.1" \
 && npm pkg set devDependencies.@types/leaflet="^1.9.12" \
 && npm install --no-audit --ignore-scripts --legacy-peer-deps
# ---------------------------------------------------------------------------

# Generate Prisma client (no-op if not present)
RUN npx prisma generate || true

# Build Next.js
RUN npm run build

# --- Runtime stage ---
FROM node:22.17.0-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=5323
WORKDIR /app

# Prisma on Alpine often needs these
RUN apk add --no-cache openssl libc6-compat

# Create non-root user/group
RUN addgroup -g 10001 -S nodegrp && adduser -S nodeusr -u 10001 -G nodegrp

# Copy only what’s needed to run
COPY --from=build --chown=nodeusr:nodegrp /app/package*.json ./
COPY --from=build --chown=nodeusr:nodegrp /app/.next ./.next
COPY --from=build --chown=nodeusr:nodegrp /app/public ./public
COPY --from=build --chown=nodeusr:nodegrp /app/node_modules ./node_modules

USER nodeusr
EXPOSE 5323
# Assumes "start": "next start -p $PORT" in package.json
CMD ["npm","start"]
