# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache wget

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN mkdir -p logs

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001
USER nodeapp

EXPOSE 5000
CMD ["node", "server.js"]
