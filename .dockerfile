# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiamos los archivos de definición
COPY package.json pnpm-lock.yaml ./

# Instalamos pnpm y las dependencias
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copiamos el resto del proyecto
COPY . .

# Compilamos TypeScript a JavaScript
RUN pnpm run build

# Etapa 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Copiamos solo lo necesario del builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Comando para ejecutar tu app
CMD ["node", "dist/app.js"]
