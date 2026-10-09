
async function dbRoute (fastify, options) {
    let db = options.db;

    fastify.post('/db/update/lang', async (request, reply) => {
        const { user, lang } = request.body ?? {};
        if (typeof user !== "string" || !["en", "fr", "jp"].includes(lang))
            return reply.code(400).send({ success: false, error: "invalid input" });
        try {
            db.prepare(`UPDATE users SET lang = ? WHERE username = ?;`).run(lang, user);
            return reply.send({ success: true });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ success: false, error: "database error" });
        }
    });

    function deleteRelation(user1, user2) {
        db.prepare(`
            DELETE FROM friends
            WHERE (user_id = ? AND friend_id = ?) 
            OR (user_id = ? AND friend_id = ?)
        `).run(user1, user2, user2, user1);
    }

    function createRelation(user1, user2, status) {
        const insertion = db.prepare(`
            INSERT INTO friends (user_id, friend_id, status)
            VALUES (?, ?, ?)
        `);
        insertion.run(user1, user2, status);
    }

    function updateStatus(user1, user2, status) {
        db.prepare(`
            UPDATE friends 
            SET
                status = ? 
            WHERE (user_id = ? AND friend_id = ?)
            OR (user_id = ? AND friend_id = ?)
        `).run(status, user1, user2, user2, user1);
    }

    function updateRStatus(user1, user2, status) {
        db.prepare(`
            UPDATE friends
            SET 
                status = ?,
                user_id = friend_id,
                friend_id = user_id
            WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `).run(status, user1, user2, user2, user1);
    }

    function getIdFromUsername(username) {
        const user = db.prepare(
            'SELECT user_id FROM users WHERE username = ?'
        ).get(username);
        return user?.user_id;
    }

    function getFriendList(user) {
        return db.prepare(`
            SELECT users.username as username, users.picture_path as pp
            FROM users
            JOIN friends 
              ON users.user_id = friends.user_id OR users.user_id = friends.friend_id
            WHERE users.user_id != ?
              AND friends.status = 'accepted'
        `).all(user);
    }

    function getFriendRelation(user1, user2) {
        return db.prepare(`
            SELECT user_id as user, status
            FROM friends
            WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
            LIMIT 1
        `).get(user1, user2, user2, user1);
    }
    
    function getUserInfo(user) {
        return db.prepare(`SELECT username, picture_path AS pp FROM users WHERE user_id = ?`).get(user);
    }

    // insert un ami
    fastify.post('/db/friends/update', async (request, reply) => {
        const body = request.body;
        
        try {
            const userId = getIdFromUsername(body.user);
            const friendId = getIdFromUsername(body.friend);

            if (!userId || !friendId) {
                return reply.status(404).send({
                    success: false,
                    error: 'User not found'
                });
            } if (userId == friendId) {
                return reply.status(400).send({
                    success: false,
                    error: 'Cannot check friendship with yourself'
                });
            }

            const datas = getFriendRelation(userId, friendId);
            if (datas) {
                if (datas.status === "blocked") {
                    const message = datas.user == userId ? "send_yblock" : "send_block";
                    return reply.status(200).send({ success: true,  message: message });
                } else if (datas.status === "pending") {
                    if (datas.user == userId) {
                        deleteRelation(userId, friendId);
                        return reply.status(200).send({ 
                            success: true, 
                            message: "send_inv", 
                            status: null 
                        });
                    } else {
                        updateStatus(userId, friendId, "accepted");
                        return reply.status(200).send({ 
                            success: true,
                            message: "send_rem",
                            status: "accepted", 
                            user: getUserInfo(userId),
                            friend: getUserInfo(friendId)
                        });
                    }
                } else {
                    deleteRelation(userId, friendId);
                    return reply.status(200).send({ 
                        success: true,
                        message: "send_inv",
                        status: null 
                    });
                }
        
            } else {
                // on creer la relation
                createRelation(userId, friendId, 'pending');
                return reply.status(200).send({ 
                    success: true,
                    message: "send_canc",
                    status: 'pending' });
            }
        } catch (error) {

            console.log("error: ", error);
            return reply.status(500).send({ 
                success: false,
                error: error.message
            });
        }
    });

    fastify.post('/db/friends/block', async (request, reply) => {
        const body = request.body;
        
        try {
            const userId = getIdFromUsername(body.user);
            const friendId = getIdFromUsername(body.friend);

            if (!userId || !friendId) {
                return reply.status(404).send({
                    success: false,
                    error: 'User not found'
                });
            } if (userId == friendId) {
                return reply.status(400).send({
                    success: false,
                    error: 'Cannot check friendship with yourself'
                });
            }

            const datas = getFriendRelation(userId, friendId);
            if (datas) {
                // Si uniquement 1 a bloque l'autre
                if (datas.status === "blocked") {
                    if (datas.user == userId)
                        deleteRelation(userId, friendId);
                    else 
                        updateStatus(userId, friendId, friendId, userId, "both_blocking");
                    return reply.status(200).send({ success: true, blocking: false });
                }
                // Si les deux sont bloques
                else if (datas.status === "both_blocking") {
                    if (datas.user == userId)
                        updateRStatus(userId, friendId, "blocked");
                    else
                        updateStatus(userId, friendId, "blocked");
                    return reply.status(200).send({ success: true, blocking: false });
                }
                // Si autre (pending, amis)
                else {
                    if (datas.user == userId) {
                        updateStatus(userId, friendId, "blocked");
                    }
                    else
                        updateRStatus(userId, friendId, "blocked");
                    return reply.status(200).send({ success: true, blocking: true });
                }
            }
            // Sinon creer un blocage
            else {
                createRelation(userId, friendId, 'blocked');
                return reply.status(200).send({ success: true, blocking: true });
            }
        } catch (error) {
            return reply.status(500).send({ success: false, error: error });
        }
    });


    // Verifie si il y a un lien d amitie
    fastify.get('/db/friends/:user/:friend', async (request, reply) => {
        try {
            const user = options.db
                .prepare('SELECT user_id FROM users WHERE username = ?')
                .get(request.params.user);

            const friend = options.db
                .prepare('SELECT user_id FROM users WHERE username = ?')
                .get(request.params.friend);

            if (!user || !friend) {
                return reply.status(404).send({
                    success: false,
                    error: 'User not found'
                });
            } if (user == friend) {
                return reply.status(400).send({
                    success: false,
                    error: 'Cannot check friendship with yourself'
                });
            }

            const userId = user.user_id;
            const friendId = friend.user_id;

            const friendship = getFriendRelation(userId, friendId);

            if (friendship) {
                if (friendship.status === 'pending') {
                    const message = friendship.user === userId
                        ? 'send_canc'
                        : 'send_acc';

                    return reply.status(200).send({
                        success: true,
                        message,
                        status: friendship.status,
                        emoji: '🔒'
                    });
                }

                if (friendship.status === 'blocked') {
                    const isBlocker = friendship.user === userId;

                    return reply.status(200).send({
                        success: true,
                        message: isBlocker ? 'unblock' : 'send_inv',
                        status: friendship.status,
                        emoji: isBlocker ? '🔓' : '🔒'
                    });
                }

                if (friendship.status === 'both_blocking') {
                    return reply.status(200).send({
                        success: true,
                        message: 'Unblock',
                        status: friendship.status,
                        emoji: friendship.user === userId ? '🔓' : '🔒'
                    });
                }

                return reply.status(200).send({
                    success: true,
                    message: 'send_rem',
                    status: friendship.status,
                    emoji: '🔒'
                });
            }

            return reply.status(200).send({
                success: true,
                message: 'send_inv',
                status: null,
                emoji: '🔒'
            });
        } catch (error) {
            request.log.error(error);

            return reply.status(500).send({
                success: false,
                error: 'Database error'
            });
        }
    });

    fastify.get('/db/friends/friendlist/:username', async (request, reply) => {
        try {
            const userId = getIdFromUsername(request.params.username);

            const friendlist = getFriendList(userId);
            reply.status(200).send({ 
                success: true, 
                friends: friendlist 
            });
        } catch (error) {
            console.log(error);
            reply.status(500).send({ 
                succes: false, 
                error: error 
            });
        }
    });

}

export default dbRoute;