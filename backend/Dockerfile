# --- Build stage: install all deps (incl. devDeps) and compile TS -> JS ---
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage: only prod deps + compiled output, smaller image ---
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT and expects the container to listen on it.
# backend/src/index.ts already reads process.env.PORT, so no code change
# was needed here — just don't hardcode a port in the container.
EXPOSE 8080
CMD ["node", "dist/index.js"]
