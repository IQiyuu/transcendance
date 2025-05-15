import Fastify from 'fastify'
import FastifyView from '@fastify/view'
import FastifyStatic from "@fastify/static";
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import jwt from '@fastify/jwt';

import ejs from 'ejs' // to remove
import fs from 'fs';
import os from 'os';

import LogginRoute from './routes/loggingRoute.js'
import GameRoute from './routes/gameRoute.js'
import websocketRoute from './routes/webSocketRoute.js';
import DbRoute from './routes/dbRoute.js';

import cookie from '@fastify/cookie';

import Database from 'better-sqlite3'
import fastifyBcrypt from 'fastify-bcrypt';

import { fileURLToPath } from 'node:url';
import { dirname, join } from "node:path";

// Recup l'ip
const networkInterfaces = os.networkInterfaces();
let localIP = 'localhost';

if (networkInterfaces.enp3s0f0) {
  for (let details of networkInterfaces.enp3s0f0) {
    if (details.family === 'IPv4' && !details.internal) {
      localIP = details.address;
      break;
    }
  }
}

// Removing mongodb, to remove view 

const secretKey = 'bommerang-fleche-upair'; // pas sur de ce que je fais la

const rootDir = dirname(dirname(fileURLToPath(import.meta.url))); // Root of the website

const fastify = Fastify({
  logger: true,
  https: {
    key: fs.readFileSync('/run/secrets/SSL-key'),
    cert: fs.readFileSync('/run/secrets/SSL-certificate')
  }
})

const db = new Database('../db/transcendence.db');

db.prepare('PRAGMA foreign_keys = ON;').run(); 

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    game_id INTEGER PRIMARY KEY AUTOINCREMENT,
    winner_id INTEGER NOT NULL,
    loser_id INTEGER NOT NULL,
    loser_score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    picture_path TEXT DEFAULT "../assets/imgs/standart.jpg",
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status STRING NOT NULL DEFAULT "pending",
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    FOREIGN KEY(friend_id) REFERENCES users(user_id)
  );
`)

const schema = db.prepare("PRAGMA table_info(friends);").all();
// console.log(schema);

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

fastify.register(websocketRoute, {
  db: db
});

fastify.register(DbRoute, {
  db: db
});

fastify.register(FastifyStatic, {
  root: join(rootDir, 'dist')
})

fastify.register(FastifyView, { // To remplace/remove
  engine: {
    ejs
  },
})

fastify.listen({ port: 3000, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
