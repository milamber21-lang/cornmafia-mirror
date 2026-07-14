# FILE: apps/web/Dockerfile
# WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

# --- Build stage ---
# Pinned Debian Bookworm image for reproducible production builds.
FROM node:22.17.0-bookworm-slim@sha256:b04ce4ae4e95b522112c2e5c52f781471a5cbc3b594527bcddedee9bc48c03a0 AS build
ENV CI=1 \
	NEXT_TELEMETRY_DISABLED=1 \
	NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
	NPM_CONFIG_AUDIT=false \
	NPM_CONFIG_FUND=false
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates openssl \
	&& rm -rf /var/lib/apt/lists/*

# Install all dependencies required by the Next.js production build.
COPY package*.json ./
RUN node --version \
	&& npm --version \
	&& npm config get registry \
	&& if [ -f package-lock.json ]; then \
		npm ci; \
	else \
		npm install; \
	fi

# Copy source and build Next.js.
COPY . .
RUN npm run build

# Test, lint, and type packages are build-time dependencies only.
RUN npm prune --omit=dev


# --- Runtime stage ---
# Use the same pinned glibc-based image family as the build stage.
FROM node:22.17.0-bookworm-slim@sha256:b04ce4ae4e95b522112c2e5c52f781471a5cbc3b594527bcddedee9bc48c03a0 AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=5323
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates openssl \
	&& rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 10001 nodegrp \
	&& useradd --uid 10001 --gid nodegrp --no-create-home --shell /usr/sbin/nologin nodeusr

COPY --from=build --chown=nodeusr:nodegrp /app/package*.json ./
COPY --from=build --chown=nodeusr:nodegrp /app/node_modules ./node_modules
COPY --from=build --chown=nodeusr:nodegrp /app/.next ./.next
COPY --from=build --chown=nodeusr:nodegrp /app/public ./public

USER nodeusr
EXPOSE 5323
CMD ["sh", "-lc", "node_modules/.bin/next start -p ${PORT}"]

# WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
