import { buildApp } from '../src/buildApp.js'

export function makeApp() {
  return buildApp({ secretKey: 'secret-de-test', dbPath: ':memory:', logger: false })
}