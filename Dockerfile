# Benim Olan API — Cloud Run image (API only; the SPA is served by Firebase Hosting).
# Built remotely by Cloud Build: `gcloud run deploy benimolan-api --source .`
FROM node:22-slim

WORKDIR /app

# Full install (incl. devDependencies): the server runs TypeScript via tsx.
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund \
  && npm cache clean --force

# Only what the server needs at runtime.
# firebase-applet-config.json = public web config (imported by src/lib/firebase.ts), not a secret.
COPY server.ts tsconfig.json firebase-applet-config.json ./
COPY server ./server
COPY src ./src

ENV NODE_ENV=production
# Cloud Run sets PORT (default 8080); server.ts reads it.
EXPOSE 8080

USER node
CMD ["npx", "tsx", "server.ts"]
