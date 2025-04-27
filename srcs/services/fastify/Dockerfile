
ARG NODE_VERSION=latest

FROM node:${NODE_VERSION}

ARG PORT=3000
EXPOSE ${PORT}

WORKDIR /home/fastify

# RUN npx tsc
# RUN npm install @fastify/view @fastify/cookie @fastify/static @fastify/websocket @fastify/multipart better-sqlite3 fastify-bcrypt @fastify/jwt

ENTRYPOINT ["npm"]

ENTRYPOINT ["sleep"]

CMD ["200"]
# CMD ["start"]