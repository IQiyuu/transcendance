import { test } from 'node:test';

import assert from 'node:assert';
import { makeApp, makeAppWithPlayers } from './helpers.js';

// friendlist

test('fetch friendship with unknow user', async () => {
    const app = await makeApp();

    const res = await app.inject({
        method: 'GET', 
        url: '/db/friends/tester/tester'
    });

    const body = res.json();
    assert.equal(res.statusCode, 404    );
    assert.equal(body.success, false);

    await app.close();
});

test('fetch friendship with myself', async (t) => {
    const app = await makeAppWithPlayers(t);

    const res = await app.inject({
        method: 'GET', 
        url: '/db/friends/tester/tester'
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
});

test('fetch friendship between two user', async (t) => {
    const app = await makeAppWithPlayers(t);

    const res = await app.inject({
        method: 'GET', 
        url: '/db/friends/tester/IQiyu'
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.equal(body.status, null);
});

// inviting friends
test('add friend with unknow users', async (t) => {
    const app = await makeApp();

    const res = await app.inject({
        method: 'POST', 
        url: '/db/friends/update',
        payload: {
            'user': 'tester',
            'friend': 'IQiyu'
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 404);
    assert.equal(body.success, false);
    
    await app.close();
});

test('add myself friend', async (t) => {
    const app = await makeAppWithPlayers(t);

    const res = await app.inject({
        method: 'POST', 
        url: '/db/friends/update',
        payload: {
            'user': 'tester',
            'friend': 'tester'
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 400);
    assert.equal(body.success, false);
});


test('add friend with known users', async (t) => {
    const app = await makeAppWithPlayers(t);

    const res = await app.inject({
        method: 'POST', 
        url: '/db/friends/update',
        payload: {
            'user': 'tester',
            'friend': 'IQiyu'
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.equal(body.status, "pending");

    // accept
    const res2 = await app.inject({
        method: 'POST', 
        url: '/db/friends/update',
        payload: {
            'user': 'IQiyu',
            'friend': 'tester'
        }
    });

    const body2 = res2.json();
    assert.equal(res2.statusCode, 200);
    assert.equal(body2.success, true);
    assert.equal(body2.status, "accepted");

    // verify
    const res3 = await app.inject({
        method: 'GET', 
        url: '/db/friends/tester/IQiyu'
    });

    const body3 = res3.json();
    assert.equal(res3.statusCode, 200);
    assert.equal(body3.success, true);
    assert.equal(body3.status, "accepted");
});

// test block friends
test('block unknow user', async () => {
    const app = await makeApp();

    const res = await app.inject({
        method: 'POST', 
        url: '/db/friends/update',
        payload: {
            'user': 'tester',
            'friend': 'IQiyu'
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 404);
    assert.equal(body.success, false);
    
    await app.close();
});