# Étape de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des fichiers de configuration
COPY package*.json ./
COPY prisma ./prisma/

# Installation des dépendances
RUN npm install

# Génération du client Prisma
RUN npx prisma generate

# Copie du code source et build
COPY . .
RUN npm run build

# Étape de production
FROM node:20-alpine AS runner

WORKDIR /app

# Copie des fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Exposition du port (par défaut 3000 pour Fastify selon index.ts)
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
