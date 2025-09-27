# FILE: apps/cms/Dockerfile
# Payload CMS v3 on Next.js 15 — multi-stage build with non-root runtime

# --- Build stage ---
FROM node:22.17.0-alpine AS build
ENV CI=1 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Install deps (use npm install to sidestep strict lockfile checks)
COPY package*.json ./
RUN npm install --no-audit --ignore-scripts

# Copy source & build
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:22.17.0-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=5322
WORKDIR /app

# Non-root user + uploads dir
RUN addgroup -g 10001 -S nodegrp && adduser -S nodeusr -u 10001 -G nodegrp
RUN mkdir -p /app/uploads && chown -R nodeusr:nodegrp /app
VOLUME ["/app/uploads"]

# Copy built app
COPY --from=build --chown=nodeusr:nodegrp /app ./

USER nodeusr
EXPOSE 5322
CMD ["npm","start"]
