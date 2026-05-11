FROM node:20-slim

WORKDIR /app

# Install OpenSSL required by Prisma schema engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install
RUN npm run build:frontend
RUN npm run build:backend
RUN npm prune --production

ENV PORT=3001
EXPOSE 3001

CMD ["sh", "-c", "cd apps/backend && npx prisma migrate deploy && node dist/index.js"]
