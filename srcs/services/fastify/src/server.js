import Fastify from 'fastify'
import FastifyView from '@fastify/view'
import FastifyStatic from "@fastify/static";
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import jwt from '@fastify/jwt';


import ejs from 'ejs'
import fs from 'fs';

import faRoute from './routes/faRoute.js';
import GoogleAuthRoute from './routes/googleAuthRoute.js';
import LogginRoute from './routes/loggingRoute.js'
import GameRoute from './routes/gameRoute.js'
import tournamentRoute from './routes/tournament.js'
import websocketRoute from './routes/webSocketRoute.js';
import DbRoute from './routes/dbRoute.js';

import cookie from '@fastify/cookie';

import Database from 'better-sqlite3'
import fastifyBcrypt from 'fastify-bcrypt';

import { fileURLToPath } from 'node:url';
import { dirname, join } from "node:path";

// Removing mongodb, to remove view 

const secretKey = 'bommerang-fleche-upair'; // pas sur de ce que je fais la

//TEMPO FAUT ETTRE CA DANS DES FICHIER

const client = '991272817830-b5g9dhidimfed8nu4d5e9sjcjumr2hnm.apps.googleusercontent.com';
const secretClient = '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';
const redirectionUri = 'https://k0r2p5.42mulhouse.fr:3000/callback';
const redirectionUri2 = 'https://k0r2p5.42mulhouse.fr:3000/callback2';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url))); // Root of the website

const fastify = Fastify({
  logger: false,
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
    twofa TEXT DEFAULT NULL,
    secret TEXT DEFAULT NULL,
    twofa_activate BOOL DEFAULT FALSE,
    email TEXT DEFAULT NULL,
    lang TEXT DEFAULT 'en',
    picture_path TEXT DEFAULT "standart.jpg",
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

fastify.register(faRoute, {
  db: db,
  secretKey: secretKey
});

fastify.register(GoogleAuthRoute, {
  db: db,
  secretKey: secretKey,
  client: client,
  secretClient: secretClient,
  redirectionUri: redirectionUri,
  redirectionUri2: redirectionUri2
});

fastify.register(GameRoute, {
  db: db,
});

fastify.register(tournamentRoute);

fastify.register(websocketRoute, {
  db: db
});

fastify.register(DbRoute, {
  db: db,
  secretKey: secretKey
});

fastify.register(FastifyStatic, {
  root: [join(rootDir, 'dist'),
    join(rootDir, 'dist/assets')
  ]
})

fastify.register(FastifyView, {
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
