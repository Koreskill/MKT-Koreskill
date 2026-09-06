FROM node:20-alpine

WORKDIR /app

# Dependencias primero, para aprovechar la cache de capas
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# Código
COPY server.js ./
COPY public ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "server.js"]
