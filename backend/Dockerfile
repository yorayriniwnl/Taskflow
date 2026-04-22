FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine

RUN apk add --no-cache wget

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodeapp -u 1001 -G nodejs \
 && mkdir -p logs \
 && chown -R nodeapp:nodejs /app

USER nodeapp

EXPOSE 5000
CMD ["node", "server.js"]
