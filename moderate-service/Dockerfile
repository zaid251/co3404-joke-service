# ── Moderate Microservice Dockerfile ──────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p /app/cache && chown -R node:node /app/cache

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

USER node

CMD ["node", "src/server.js"]
