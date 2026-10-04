import fs from 'fs'
import { buildApp } from './app.js'

const secretKey = fs.readFileSync('/run/secrets/JWT-secret', 'utf8').trim()

const fastify = await buildApp({
  secretKey,
  https: {
    key: fs.readFileSync('/run/secrets/SSL-key'),
    cert: fs.readFileSync('/run/secrets/SSL-certificate'),
  },
})

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})