import { test } from 'node:test'
import assert from 'node:assert'
import { makeApp } from './helpers.js'

async function appWithPlayers(t) {
  const app = await makeApp()
  t.after(() => app.close())
  for (const username of ['tester', 'tested']) {
    await app.inject({
      method: 'POST', url: '/register',
      payload: { username, password: 'Passw0rd!' },
    })
  }
  return app
}

test('fetch unexistant user', async () => {
    const app = await makeApp();

    const res = await app.inject({ method: 'GET', url: '/profile/tester' });
    assert.equal(res.statusCode, 404);
    assert.equal(res.json().success, false);
    assert.equal(res.json().datas, undefined);

    await app.close();
});


test('fetch register user', async (t) => {
    const app = await appWithPlayers(t);

    const res = await app.inject({ method: 'GET', url: '/profile/tester' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().datas.username, 'tester');
    assert.equal(res.json().success, true);
});

test('fetch histo of unknow user', async () => {
    const app = await makeApp();

    const res = await app.inject({ method: 'GET', url: '/historic/unknow' });
    assert.equal(res.statusCode, 404);
    assert.equal(res.json().success, false);

    await app.close();
});

test('fetch profile of registed player without games', async (t) => {
    const app = await appWithPlayers(t);

    const res = await app.inject({ method: 'GET', url: '/historic/tester' });
    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.datas.length, 0);
});

test('add game to historic', async (t) => {
    const app = await appWithPlayers(t);

    const res = await app.inject({ method: 'POST', url: '/game/storeGame', headers: { "Content-Type": "application/json" },
        payload: {
            winner_username: "tester",
            loser_username: "tested",
            loser_score: 0
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);

    const histo = await app.inject({ method: 'GET', url: '/historic/tester' });
    const games = histo.json().datas;
    assert.equal(games.length, 1);
    assert.equal(games[0].winner_username, 'tester');
    assert.equal(games[0].loser_username, 'tested');
});
