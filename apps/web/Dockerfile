# FILE: apps/web/Dockerfile

# --- Build stage ---
# node:22.17.0-alpine pinned by digest for reproducible production builds.
FROM node:22.17.0-alpine@sha256:fc3e945f920b7e3000cd1af86c4ae406ec70c72f328b667baf0f3a8910d69eed AS build
ENV CI=1 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Install deps (lockfile preferred). CI owns dependency audit checks; image builds stay deterministic.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit; else npm install --no-audit; fi

# Copy source
COPY . .

# Build Next.js
RUN npm run build


# --- Runtime stage ---
# node:22.17.0-alpine pinned by digest for reproducible production runtime pulls.
FROM node:22.17.0-alpine@sha256:fc3e945f920b7e3000cd1af86c4ae406ec70c72f328b667baf0f3a8910d69eed AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=5323
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

RUN addgroup -g 10001 -S nodegrp && adduser -S nodeusr -u 10001 -G nodegrp

COPY --from=build --chown=nodeusr:nodegrp /app/package*.json ./
COPY --from=build --chown=nodeusr:nodegrp /app/node_modules ./node_modules
COPY --from=build --chown=nodeusr:nodegrp /app/.next ./.next
COPY --from=build --chown=nodeusr:nodegrp /app/public ./public

USER nodeusr
EXPOSE 5323
CMD ["sh", "-lc", "node_modules/.bin/next start -p ${PORT}"]
