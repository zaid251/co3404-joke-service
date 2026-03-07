# ── Joke Microservice Dockerfile ──────────────────────────────────────────────
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy application source
COPY . .

# Create cache directory for types
RUN mkdir -p /app/cache && chown -R node:node /app/cache

# Expose service port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Run as non-root user for security
USER node

CMD ["node", "src/server.js"]
