
ARG NODE_VERSION=latest

FROM node:${NODE_VERSION}

ARG PORT=3000
EXPOSE ${PORT}

COPY --chmod=775 ./start.sh /home/start.sh

# WORKDIR /home/fastify

ENTRYPOINT ["bash", "/home/start.sh"]
