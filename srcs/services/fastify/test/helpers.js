import { buildApp } from '../src/buildApp.js'

export function makeApp() {
  return buildApp({ secretKey: 'secret-de-test', dbPath: ':memory:', logger: false })
}

export async function appWithPlayers(t) {
  const app = await buildApp({ secretKey: 'secret-de-test', dbPath: ':memory:', logger: false });
  t.after(() => app.close())
  for (const username of ['tester', 'tested']) {
    await app.inject({
      method: 'POST', url: '/register',
      payload: { username, password: 'Passw0rd!' },
    })
  }
  return app
}