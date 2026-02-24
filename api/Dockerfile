# Imagen de desarrollo con Node 20
FROM node:20-alpine

WORKDIR /usr/src/app

# Dependencias (incluye devDependencies para watch/hot-reload)
COPY package*.json ./
RUN npm install

# Variables para watch estable dentro de contenedores
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

# Puerto NestJS
EXPOSE 3000

# Modo desarrollo con hot-reload
CMD ["npm", "run", "start:dev"]