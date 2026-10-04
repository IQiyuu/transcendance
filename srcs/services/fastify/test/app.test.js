import { test } from 'node:test'
import assert from 'node:assert'
import { buildApp } from '../src/buildApp.js'

const options = { secretKey: 'secret-de-test', dbPath: ':memory:', logger: false }

test("l'app démarre", async () => {
  const app = await buildApp(options)
  await app.ready()
  await app.close()
})

test('une route inconnue renvoie 404', async () => {
  const app = await buildApp(options)
  const res = await app.inject({ method: 'GET', url: '/cette-route-nexiste-pas' })
  assert.equal(res.statusCode, 404)
  await app.close()
})