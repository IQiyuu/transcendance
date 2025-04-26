
ARG NODE_VERSION=latest

FROM node:${NODE_VERSION}

ARG PORT=3000
EXPOSE ${PORT}

WORKDIR /home/fastify

RUN npm update
# RUN npm install fastify fastify-cli
# RUN npm install @fastify/view @fastify/cookie @fastify/static @fastify/websocket @fastify/multipart better-sqlite3 fastify-bcrypt @fastify/jwt

ENTRYPOINT ["node"]

ENTRYPOINT ["sleep"]

CMD ["200"]
# CMD ["src/server.js"]