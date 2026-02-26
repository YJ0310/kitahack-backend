# ─── Dockerfile for Cloud Run deployment (App Hosting: Backend + Flutter SPA) ─
FROM node:22-slim

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code + Flutter web build (public/)
COPY . .

# Remove local .env and service account (Cloud Run provides env vars + Workload Identity)
RUN rm -f .env kitahack-tehais-firebase-adminsdk-fbsvc-5c3eff98c9.json

# Cloud Run injects PORT env var (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "server.js"]
