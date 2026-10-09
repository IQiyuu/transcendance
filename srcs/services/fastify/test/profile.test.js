import { test } from 'node:test';

import { readFile } from 'node:fs/promises';

import assert from 'node:assert';
import { makeApp, makeAppWithPlayers, uploadImage } from './helpers.js';

test('fetch unexistant user', async () => {
    const app = await makeApp();

    const res = await app.inject({ method: 'GET', url: '/profile/tester' });
    assert.equal(res.statusCode, 404);
    assert.equal(res.json().success, false);
    assert.equal(res.json().datas, undefined);

    await app.close();
});


test('fetch register user', async (t) => {
    const app = await makeAppWithPlayers(t);

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
    const app = await makeAppWithPlayers(t);

    const res = await app.inject({ method: 'GET', url: '/historic/tester' });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.datas.length, 0);
});

test('store game with unknow user', async (t) => {
    const app = await makeApp();

    const res = await app.inject({
        method: 'POST',
        url: '/game/storeGame',
        payload: {
            winner_username: 'tester',
            loser_username: 'unknown',
            loser_score: 0
        }
    });

    assert.equal(res.statusCode, 404);
    assert.equal(res.json().success, false);

    await app.close();
});

test('store game to historic', async (t) => {
    const app = await makeAppWithPlayers(t);

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

// Test upload picture

test('upload pic without file', async (t) => {
    const app = await makeAppWithPlayers(t);

    const res = await uploadImage(null, app);

    const body = res.json();
    assert.equal(res.statusCode, 400);
    assert.equal(body.success, false);
});

test('upload pic of unknow user', async () => {
    const app = await makeApp();

    const image = await readFile(
        new URL('../../../assets/imgs/IQiyu.jpg', import.meta.url)
    );

    const res = await uploadImage(image, app);

    const body = res.json();
    assert.equal(res.statusCode, 404);
    assert.equal(body.success, false);
    
    await app.close();
});

test('upload pic of known user', async (t) => {
    const app = await makeAppWithPlayers(t);

    const image = await readFile(
        new URL('../../../assets/imgs/IQiyu.jpg', import.meta.url)
    );

    const res = await uploadImage(image, app);

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
});