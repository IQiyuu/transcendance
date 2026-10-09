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
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 404);
    assert.equal(body.success, false);
});

test('block myself', async (t) => {
    const app = await makeAppWithPlayers(t);

    const res = await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'tester'
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 400);
    assert.equal(body.success, false);

    await app.close();
});

test('block user', async (t) => {
    const app = await makeAppWithPlayers(t);

    const res = await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.equal(body.blocking, true);
});

test('unblock user', async (t) => {
    const app = await makeAppWithPlayers(t);

    // Block the user first
    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    const res = await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.equal(body.blocking, false);
});

test('block user who already blocked me', async (t) => {
    const app = await makeAppWithPlayers(t);

    // IQiyu blocks tester first
    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'IQiyu',
            friend: 'tester'
        }
    });

    // tester blocks IQiyu
    const res = await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.equal(body.blocking, true);
});

test('unblock user when we both block each other', async (t) => {
    const app = await makeAppWithPlayers(t);

    // Both users block each other
    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'IQiyu',
            friend: 'tester'
        }
    });

    // tester unblocks IQiyu
    const res = await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.equal(body.blocking, false);
});

// test block friends status
test('friend status after blocking user', async (t) => {
    const app = await makeAppWithPlayers(t);

    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    const res = await app.inject({
        method: 'GET',
        url: '/db/friends/tester/IQiyu'
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.equal(body.status, 'blocked');
    assert.equal(body.message, 'unblock');
});

test('friend status after unblocking user', async (t) => {
    const app = await makeAppWithPlayers(t);

    // Block first
    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    // Unblock
    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    const res = await app.inject({
        method: 'GET',
        url: '/db/friends/tester/IQiyu'
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.equal(body.status, null);
    assert.equal(body.message, 'send_inv');
});

test('friend status when both users block each other', async (t) => {
    const app = await makeAppWithPlayers(t);

    // tester blocks IQiyu
    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    // IQiyu blocks tester
    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'IQiyu',
            friend: 'tester'
        }
    });

    const res = await app.inject({
        method: 'GET',
        url: '/db/friends/tester/IQiyu'
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.equal(body.status, 'both_blocking');
});

test('friend status after one user unblocks in a mutual block', async (t) => {
    const app = await makeAppWithPlayers(t);

    // Both users block each other
    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'IQiyu',
            friend: 'tester'
        }
    });

    // tester unblocks IQiyu
    await app.inject({
        method: 'POST',
        url: '/db/friends/block',
        payload: {
            user: 'tester',
            friend: 'IQiyu'
        }
    });

    const res = await app.inject({
        method: 'GET',
        url: '/db/friends/tester/IQiyu'
    });

    const body = res.json();
    assert.equal(res.statusCode, 200);
    assert.equal(body.success, true);
    assert.equal(body.status, 'blocked');
});
