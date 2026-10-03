ARG NODE_VERSION=22

# --- Stage 1 : build ---
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app

COPY services/fastify/package*.json ./
RUN npm ci

COPY services/fastify/tsconfig.json ./
COPY services/fastify/src ./src
COPY assets ./dist/assets

RUN npm run build \
 && cp dist/assets/favicon.ico dist/favicon.ico

# --- Stage 2 : image finale ---
FROM node:${NODE_VERSION}-slim
ENV NODE_ENV=production
WORKDIR /home/fastify

COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

RUN mkdir -p /home/db && chown node:node /home/db
USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]