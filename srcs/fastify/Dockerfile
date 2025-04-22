
ARG NODE_VERSION=latest

FROM node:${NODE_VERSION}

ARG PORT=3000
EXPOSE ${PORT}

RUN npm install @fastify/view @fastify/cookie @fastify/static
    @fastify/websocket
    @fastify/multipart
    better-sqlite3
    fastify-bcrypt
    @fastify/jwt
ENTRYPOINT ["npm", "package.json"]