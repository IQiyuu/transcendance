import { buildApp } from '../src/buildApp.js'
import { randomUUID } from 'node:crypto';


export async function makeApp(t) {
    const app = await buildApp({
        secretKey: 'secret-de-test',
        dbPath: ':memory:',
        logger: false
    });

    t?.after(() => app.close());

    return app;
}

export async function makeAppWithPlayers(t) {
  const app = await buildApp({ 
    secretKey: 'secret-de-test', 
    dbPath: ':memory:', 
    logger: false 
  });
  t.after(() => app.close())
  for (const username of ['tester', 'tested', 'IQiyu']) {
    await app.inject({
      method: 'POST', url: '/register',
      payload: { 
        username,
        password: 'Passw0rd!'
      },
    })
  }
  return app
}

export async function uploadImage(img, app) {
      const boundary = `----test-${randomUUID()}`;

      let payload;
      if (img) {
          payload = Buffer.concat([
              Buffer.from(
                  `--${boundary}\r\n` +
                  `Content-Disposition: form-data; name="picture"; filename="test.jpg"\r\n` +
                  `Content-Type: image/jpeg\r\n\r\n`
              ),
              img,
              Buffer.from(`\r\n--${boundary}--\r\n`)
          ]);
      } else {
          payload = Buffer.from(
              `--${boundary}--\r\n`
          );
      }

    const res = await app.inject({ 
      method: 'POST',
      url: '/upload/picture/IQiyu',
      headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`
      },
      payload
    });

    return res;
}