
async function dbRoute (fastify, options) {
    let db = options.db;
    let secretKey = options.secretKey;
    let img_path = "dist/assets/imgs/";

    const usernameTester = async (request, reply) => {
        var username = null;
        if (request.body)
            username = request.body.username;
        if (username == null && request.params)
            username = request.params.username;
        if (username == null)
            return reply.send({ success: false, error: "username error" });
        const token = request.cookies.auth_token;

        if (!token) {
            return reply.send({ success: false });
        }

        try {
            const decoded = fastify.jwt.verify(token, secretKey);
            if (decoded == null)
                throw Error("Not authorized");
            try {
            const user = db.prepare('SELECT username FROM users WHERE username = ?').get(decoded.username);
            if (!user)
                throw Error("Not authorized2");
            if (decoded.username == username)
                request.user = decoded.username;
            else
                throw Error("Not authorized3");
            } catch (error) {
            return reply.send({ success: false, error: error.message });
            }
        } catch (error) {
            return reply.send({ success: false, error: error.message });
        }
    };

    // Route qui recupere les infos du user :username dans la db et les renvoie
    fastify.get('/db/profile/:username', async (request, reply) => {
        try {
            const username = request.params.username;
            // console.log(username);
            // ajouter l'image de profile
            if (!db.prepare(`SELECT username FROM users WHERE username = ?`).get(username))
                return {success: false, message: "User don't exists"};
            const data = options.db.prepare('SELECT username, created_at, picture_path FROM users WHERE username = ?').get(username);
            // console.log(`Profile fetched from db: `, data);
            if (data === null || data === undefined)
                   throw (Error("Unkown error while retreiving profile info in db"));
            return { success: true, message: `Profile fetched`, profile: data };
        } catch (error) {
            console.log("error: ", error);
            return { success: false, message: 'Error data db.' };
        }
    });

    // Route qui modifie la photo de profile ../assets/imgs et change le path dans la db
    fastify.post('/db/update/picture/:username', {
        preHandler: usernameTester,
    }, async (request, reply) => {
        const data = await request.parts();
        let uploadedFile;
        const username = request.params.username;
        for await (const part of data) {
            if (part.file) {
                // console.log(username);
                    uploadedFile = part;
        
                const filename = username + ".jpg";
        
                const filepath = img_path + filename;
            
                const fileStream = fs.createWriteStream(filepath);
                part.file.pipe(fileStream);
    
                fileStream.on('finish', () => {
                    try {
                        options.db.prepare('UPDATE users SET picture_path = ? WHERE username = ?').run(filename, username);
                        
                        // console.log('Picture uploaded in db for: ', username);
                        return { success: true, message: 'File uploaded' };
                    } catch (error) {
                        console.error('Error updating data in db.', error);
                        return { success: false, message: 'Error updating data in db' };
                    }
                    
                });
            }
        }
    });
    
    // Pareil que au dessus avec les games
    fastify.get('/db/historic/:username', async (request, reply) => {
        try {
            const username = request.params.username;
            // console.log(username);
            const data = options.db.prepare('SELECT g.game_id, uw.username AS winner_username, ul.username AS loser_username, g.loser_score, g.created_at FROM games g JOIN users uw ON g.winner_id = uw.user_id JOIN users ul ON g.loser_id = ul.user_id WHERE uw.username = ? OR ul.username = ? ORDER BY g.created_at DESC;').all(username,username);
    
            // console.log(`historic fetched from db: `, data);
            return { success: true, message: `Game fetched`, histo: data };
        } catch (error) {
            console.error('Error data db.', error);
            return { success: false, message: 'Error data db.' };
        }
    });

    // retourne les infos du user demande
    fastify.get('/db/select/users/:username' , async (request, reply) => {
        try {
            const datas = db.prepare(`
                SELECT username, profile_path as pp, 
                 FROM users`).all();
            reply.send(datas);
        } catch (error) {
            console.log("error: ", error);
            return { success: false, error: error.message };
        }
    });

    // retourne le password du user demande
    fastify.get('/db/password/:username', {
        preHandler: usernameTester,
    }, async (request, reply) => {
        try {
            const datas = db.prepare(`SELECT password, FROM users WHERE username = ?`).get(request.username);
            return { success: false, data: datas };
        } catch (error) {
            console.log("error: ", error);
            return { success: false, error: error.message };
        }
    });

    // get lang
    fastify.get('/db/select/lang/:user' , {
        preHandler: usernameTester,
    }, async (request, reply) => {
        try {
            const datas = db.prepare(`SELECT lang FROM users WHERE username=?`).get(request.params.user);
            if (datas)
                reply.send({success:true, lang: datas.lang});
            else
                reply.send({success:false, error: "user not found"});
        } catch (error) {
            console.log("error: ", error);
            return { success: false, error: error.message };
        }
    });

    async function isValidUsername(username) {
        const minLength    = username.length >= 3;
        const maxLength    = username.length <= 15;
        const hasSpecial   = /[!@#$%^&*(),.?":{}|<>]/.test(username);

        return minLength && maxLength && !hasSpecial;
    }

    // modifying username
    fastify.post('/db/update/username', {
        preHandler: usernameTester,
    }, async (req, rep) => {
        const { newUsername, username } = req.body;

        try {
            if (newusername == username) 
                return { success: false, error: 'errUSame' };
            if (!(await isValidUsername(newUsername))) 
                return { success: false, error: 'errUname' };

            if (db.prepare(`SELECT username FROM users WHERE username = ?`).get(newUsername) != null)
                return ({ sucess: false, error: "errUTaken" });
            db.prepare(`UPDATE users SET username = ? WHERE username = ?`).run(newUsername, username);
            return ({ success: true });
        } catch (error) {
            return ({ success: false, error: error.message });
        }
    });

    async function isValidPassword(password) {
        const minLength    = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasDigit     = /[0-9]/.test(password);
        const hasSpecial   = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return minLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
    }

    // modifying password
    fastify.post('/db/update/password', {
        preHandler: usernameTester,
    }, async (req, rep) => {
        const body = req.body;

        try {
            console.log(body);
            const user = db.prepare(`SELECT password FROM users WHERE username = ?`).get(body.username);
            if (user == null)
                return ({ sucess: false, error: "errorInt" });
            const isMatch = await fastify.bcrypt.compare(body.password, user.password);
            console.log(isMatch);
            if (!isMatch) {
                console.log("mismatch");
                return ({ success: false, error: "errMismatch" });
            }
            if (await isValidPassword(body.newPassword))
                var hash_pass = await fastify.bcrypt.hash(body.newPassword);
            else
                return ({ success: false, error: "errMdp" });
            db.prepare(`UPDATE users SET password = ? WHERE username = ?`).run(hash_pass, body.username);
            return ({ success: true });
        } catch (error) {
            return ({ success: false, error: error.message });
        }
    });

    // modifiyng lang
    fastify.post('/db/update/lang', {
        preHandler: usernameTester,
    }, async (request, reply) => {
        const body = request.body;
        try {
            db.prepare(`UPDATE users
                SET lang = ?
                WHERE username = ?;
            `).run(body.lang, body.username);
            reply.send({success: true});
        } catch (error) {
            console.log("error: ", error);
            return { success: false, error: error.message };
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
        const data = db.prepare('SELECT user_id FROM users WHERE username = ?').get(username);
        if (data)
            return data.user_id;
        return "";
    }

    function getFriendList(user) {
        return db.prepare(`
            SELECT users.username as username, users.picture_path as pp
            FROM users
            JOIN friends ON (
                (friends.user_id = ? AND friends.friend_id = users.user_id)
                OR
                (friends.friend_id = ? AND friends.user_id = users.user_id)
            )
            WHERE friends.status = 'accepted'
        `).all(user, user);
    }

    // SELETCIONNER LE USERNAME ET LA PP DE USERS AVEC FRIENDS QUI A LE MEME ID (friend user ou friend friend) QUAND le user id c'est pas celui de l'utilisateur qui a fait la requete

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
    fastify.post('/db/friends/update',  {
        preHandler: usernameTester,
    }, async (request, reply) => {
        const body = request.body;
        
        try {
            const userId = getIdFromUsername(body.username);
            const friendId = getIdFromUsername(body.friend);

            const datas = getFriendRelation(userId, friendId);
            if (datas) {
                if (datas.status === "blocked") {
                    const message = datas.user == userId ? "send_yblock" : "send_block";
                    return { success: true,  message: message };
                } else if (datas.status === "pending") {
                    if (datas.user == userId) {
                        deleteRelation(userId, friendId);
                        return { success: true, message: "send_inv", status: null };
                    } else {
                        updateStatus(userId, friendId, "accepted");
                        return { success: true, message: "send_rem", status: "accepted", user: getUserInfo(userId), friend: getUserInfo(friendId) };
                    }
                } else {
                    deleteRelation(userId, friendId);
                    return { success: true, message: "send_inv", status: null };
                }
        
            } else {
                // on creer la relation
                createRelation(userId, friendId, 'pending');
                return { success: true, message: "send_canc", status: 'pending' };
            }
        } catch (error) {

            console.log("error: ", error);
            return { success: false, error: error.message };
        }
    });

    fastify.post('/db/friends/block', {
        preHandler: usernameTester,
    }, async (request, reply) => {
        const body = request.body;
        
        try {
            const userId = getIdFromUsername(body.username);
            const friendId = getIdFromUsername(body.friend);

            const datas = getFriendRelation(userId, friendId);

            if (datas) {
                // Si uniquement 1 a bloque l'autre
                if (datas.status === "blocked") {
                    if (datas.user == userId)
                        deleteRelation(userId, friendId);
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
            reply.send({ success: false, error: error.message });
        }
    });


    // Verifie si il y a un lien d amitie
    fastify.get('/db/friends/:user/:friend',  {
        preHandler: usernameTester,
    }, async (request, reply) => {
        try {
            const userId = getIdFromUsername(request.params.user);
            const friendId = getIdFromUsername(request.params.friend);
    
            const friendship = getFriendRelation(userId, friendId);
            if (friendship) {
                if (friendship.status == "pending") {
                    const message = friendship.user == userId ? "send_canc" : "send_acc";
                    reply.send({ success: true, message: message, status: friendship.status, emoji: "🔒" });
                } else if (friendship.status == "blocked") {
                    const message = friendship.user == userId ? "unblock" : "send_inv";
                    const emoji = friendship.user == userId ? "🔓" : "🔒";
                    reply.send({ success: true, message: message, status: friendship.status, emoji: emoji });
                } else if (friendship.status == "both_blocking") {
                    const emoji = friendship.user == userId ? "🔓" : "🔒";
                    reply.send({ success: true, message: "Unblock", status: friendship.status, emoji: emoji });
                } else {
                    reply.send({ success: true, message: "send_rem", status: friendship.status, emoji: "🔒" });
                }
            } else {
                reply.send({ success: true, message: "send_inv", status: null, emoji: "🔒" });
            }
        } catch (error) {
            reply.send({ success: false, error: error.message });
        }
    });

    fastify.get('/db/friends/friendlist/:username', {
        preHandler: usernameTester,
    }, async (request, reply) => {
        console.log("OUIII");
        try {
            const userId = getIdFromUsername(request.params.username);
            if (!userId)
                reply.send({ succes: false, error: "user not found" });
            const friendlist = getFriendList(userId);
            reply.send({ success: true, friends: friendlist });
        } catch (error) {
            console.log(error);
            reply.send({ succes: false, error: error.message });
        }
    });

}

export default dbRoute;
