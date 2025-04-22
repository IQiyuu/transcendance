import Fastify from 'fastify'
import FastifyView from '@fastify/view'
import FastifyStatic from "@fastify/static";
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import jwt from '@fastify/jwt';

import ejs from 'ejs'
import fs from 'fs';
import os from 'os';

import LogginRoute from './loggingRoute.js'
import GameRoute from './gameRoute.js'
import ChatRoute from './chatRoute.js';

import cookie from '@fastify/cookie';

import Database from 'better-sqlite3'
import fastifyBcrypt from 'fastify-bcrypt';

import { fileURLToPath } from 'node:url';
import { dirname, join } from "node:path";

// Recup l'ip
const networkInterfaces = os.networkInterfaces();
let localIP = 'localhost';

if (networkInterfaces.enp6s0) {
  for (let details of networkInterfaces.enp6s0) {
    if (details.family === 'IPv4' && !details.internal) {
      localIP = details.address;
      break;
    }
  }
}

const secretKey = 'bommerang-fleche-upair'; // pas sur de ce que je fais la

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const fastify = Fastify({
  logger: true,
  https: {
    key: fs.readFileSync(join(rootDir, '/.ssl/ssl.key')),
    cert: fs.readFileSync(join(rootDir, '/.ssl/ssl.crt'))
  }
})

const db = new Database('../sqlite/transcendance.db');

fastify.register(fastifyWebsocket);

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

fastify.register(cookie);

fastify.register(jwt, {
  secret: secretKey
});

fastify.register(fastifyBcrypt, {
  saltWorkFactor: 12
})

fastify.register(LogginRoute, {
  db: db,
  secretKey: secretKey
});

fastify.register(GameRoute, {
  db: db,
});

fastify.register(ChatRoute);

fastify.register(FastifyStatic, {
  root: join(rootDir, 'dist')
})

fastify.register(FastifyView, {
  engine: {
    ejs
  },
})

fastify.listen({ port: 3001, host: localIP }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
