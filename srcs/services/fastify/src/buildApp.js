// app.js (même dossier que ton fichier serveur actuel)
import Fastify from 'fastify'
import FastifyView from '@fastify/view'
import FastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import fastifyMultipart from '@fastify/multipart'
import jwt from '@fastify/jwt'
import ejs from 'ejs'
import cookie from '@fastify/cookie'
import Database from 'better-sqlite3'
import fastifyBcrypt from 'fastify-bcrypt'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import LogginRoute from './routes/loggingRoute.js'
import GameRoute from './routes/gameRoute.js'
import tournamentRoute from './routes/tournament.js'
import websocketRoute from './routes/webSocketRoute.js'
import DbRoute from './routes/dbRoute.js'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))

export async function buildApp({
  secretKey,                          // ← plus de readFileSync ici
  dbPath = '../db/transcendence.db',  // ← configurable
  https,                              // ← optionnel
  logger = true,
} = {}) {
  const fastify = Fastify({ logger, ...(https && { https }) })

  const db = new Database(dbPath)
  db.prepare('PRAGMA foreign_keys = ON;').run()
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

  fastify.addHook('onClose', () => db.close())      // ← ferme la DB proprement

  fastify.register(fastifyWebsocket)
  fastify.register(fastifyMultipart, { limits: { fileSize: 10 * 1024 * 1024 } })
  fastify.register(cookie)
  fastify.register(jwt, { secret: secretKey })
  fastify.register(fastifyBcrypt, { saltWorkFactor: 12 })
  fastify.register(LogginRoute, { db, secretKey })
  fastify.register(GameRoute, { db })
  fastify.register(tournamentRoute)
  fastify.register(websocketRoute, { db })
  fastify.register(DbRoute, { db })
  fastify.register(FastifyStatic, { root: join(rootDir, 'dist') })
  fastify.register(FastifyView, { engine: { ejs }, root: join(rootDir, 'dist', 'views') })

  return fastify   // ← pas de listen
}