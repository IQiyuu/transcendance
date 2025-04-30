import { stat } from "fs";

async function dbRoute (fastify, options) {
    let db = options.db;

    // retourne les lignes de la tables
    fastify.get('/db/select/:table' , async (request, reply) => {
        try {
            const datas = db.prepare(`SELECT * FROM ${request.params.table}`).all();
            reply.send(datas);
        } catch (error) {
            console.log("error: ", error);
            return { success: false, error: error };
        }
    });

    // retourne les tables de la db
    fastify.get('/db/tables' , async (request, reply) => {
        try {
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
            reply.send(tables);
        } catch (error) {
            console.log("error: ", error);
            return { success: false, error: error };
        }
    });

    // retourne comment sont faites les tables
    fastify.get('/db/pragma/:table' , async (request, reply) => {
        try {
            const tableInfo = db.prepare(`PRAGMA table_info(${request.params.table});`).all();
            reply.send(tableInfo);
        } catch (error) {
            console.log("error: ", error);
            return { success: false, error: error };
        }
    });

    // update une ligne de la table
    fastify.get('/db/update/:table' , async (request, reply) => {
        const body = request.body;
        try {
            const insert = db.prepare('UPDATE ? SET ? = ? WHERE ? = ?')
            insert.run(request.params.table, body.colum, body.val, body.column2, body.val2);
            return { success: true };
        } catch (error) {
            console.log("error: ", error);
            return { success: false, error: error };
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
        return db.prepare('SELECT user_id FROM users WHERE username = ?').get(username).user_id;
    }

    function getFriendList(user) {
        return db.prepare(`
            SELECT users.username
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
    
    // insert un ami
    fastify.post('/db/friends/update', async (request, reply) => {
        const body = request.body;
        
        try {
            const userId = getIdFromUsername(body.user);
            const friendId = getIdFromUsername(body.friend);

            const datas = getFriendRelation(userId, friendId);
            if (datas) {
                if (datas.status === "blocked") {
                    const message = datas.user == userId ? "You blocked this user" : "You are blocked";
                    return { success: true,  message: message };
                } else if (datas.status === "pending") {
                    if (datas.user == userId) {
                        deleteRelation(userId, friendId);
                        return { success: true, message: "Send invitation", status: null };
                    } else {
                        updateStatus(userId, friendId, "accepted");
                        reply.send({ success: true, message: "Remove friend", status: "accepted" });
                    }
                } else {
                    deleteRelation(userId, friendId);
                    return { success: true, message: "Send invitation", status: null };
                }
            } else {
                // on creer la relation
                createRelation(userId, friendId, 'pending');
                return { success: true, message: "Cancel invitation", status: 'pending' };
            }
        } catch (error) {
            console.log("error: ", error);
            return { success: false, error: error.message };
        }
    });

    fastify.post('/db/friends/block', async (request, reply) => {
        const body = request.body;
        
        try {
            const userId = getIdFromUsername(body.user);
            const friendId = getIdFromUsername(body.friend);

            const datas = getFriendRelation(userId, friendId);

            if (datas) {
                // Si uniquement 1 a bloque l'autre
                if (datas.status === "blocked") {
                    if (datas.user == userId) {
                        deleteRelation(userId, friendId);
                        return { success: true, blocking: false };
                    }
                    else 
                        updateStatus(userId, friendId, friendId, userId, "both_blocking");
                    return { success: true, blocking: false };
                }
                // Si les deux sont bloques
                else if (datas.status === "both_blocking") {
                    if (datas.user == userId)
                        updateRStatus(userId, friendId, "blocked");
                    else
                        updateStatus(userId, friendId, "blocked");
                    return { success: true, blocking: false };
                }
                // Si autre (pending, amis)
                else {
                    if (datas.user == userId) {
                        updateStatus(userId, friendId, "blocked");
                    }
                    else
                        updateRStatus(userId, friendId, "blocked");
                    return { success: true, blocking: true };
                }
            }
            // Sinon creer un blocage
            else {
                createRelation(userId, friendId, 'blocked');
                return { success: true, blocking: true };
            }
        } catch (error) {
            reply.send({ success: false, error: error });
        }
    });

    // Verifie si il y a un lien d amitie
    fastify.get('/db/friends/:user/:friend', async (request, reply) => {
        const body = request.body;

        try {
            const userId = getIdFromUsername(body.user);
            const friendId = getIdFromUsername(body.friend);
    
            const friendship = getFriendRelation(userId, friendId);
    
            if (friendship) {
                if (friendship.status == "pending") {
                    const message = friendship.user == userId ? "Cancel invitation" : "Accept invitation";
                    reply.send({ success: true, message: message, status: friendship.status, emoji: "🔒" });
                } else if (friendship.status == "blocked") {
                    const message = friendship.user == userId ? "Unblock" : "Send invitation";
                    const emoji = friendship.user == userId ? "🔓" : "🔒";
                    reply.send({ success: true, message: message, status: friendship.status, emoji: emoji });
                } else if (friendship.status == "both_blocking") {
                    const emoji = friendship.user == userId ? "🔓" : "🔒";
                    reply.send({ success: true, message: "Unblock", status: friendship.status, emoji: emoji });
                } else {
                    reply.send({ success: true, message: "Remove friend", status: friendship.status, emoji: "🔒" });
                }
            } else {
                reply.send({ success: true, mesage: "Send invitation", status: friendship.status, emoji: "🔒" });
            }
        } catch (error) {
            reply.send({ success: false, error: error.message });
        }
    });

}

export default dbRoute;