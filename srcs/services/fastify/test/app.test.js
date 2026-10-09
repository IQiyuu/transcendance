import { test } from 'node:test'
import assert from 'node:assert'
import { makeApp } from './helpers.js'

test("App is working", async () => {
  const app = await makeApp()
  await app.ready()
  await app.close()
})

test('Unknow road', async () => {
  const app = await makeApp()
  const res = await app.inject({ method: 'GET', url: '/cette-route-nexiste-pas' })
  assert.equal(res.statusCode, 404)
  await app.close()
})