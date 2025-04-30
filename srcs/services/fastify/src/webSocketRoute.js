async function websocketRoute(fastify, options) {
    const db = options.db;
    let waiting_list = null;
    let w_uname = null;
    let connectedClients = new Map();

    fastify.addHook('preValidation', async (request, reply) => {
        if (request.routerPath === '/ws' && !request.query.username) {
            reply.code(403).send('Connection rejected: missing username');
        }
    });

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

    fastify.register(async function (fastify) {
        fastify.get('/ws', { websocket: true }, (socket, req) => {
            const username = req.query.username;

            console.log(`${username} connected.`);

            // Diffuser un message à tout le monde
            function broadcast(message) {
                for (const [socket, username] of connectedClients) {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify(message));
                    }
                }
            }

            function sendInfosFriends(socket, username, t) {
                const friendlist = getFriendList(username);
            
                for (let friend of friendlist) {
                    for (let [sock, uname] of connectedClients.entries()) {
                        if (uname === friend.username) {
                            // envoie a l'ami de celui qui vient de se co
                            sock.send(JSON.stringify({
                                type: t,
                                user: username,
                            }));
                            // envoie a celui qui vient de se co
                            socket.send({
                                type: t,
                                friendlist: uname
                            });
                        }
                    }
                }
            }            

            // Quand un user ferme sa connexion
            socket.on('close', () => {
                // Si le joueur attendait un match
                if (waiting_list && w_uname === username) {
                    waiting_list = null;
                    w_uname = null;
                }
                sendInfosFriends(socket, username, "disconnection");
                connectedClients.delete(socket);
            });

            // Quand un message arrive
            socket.on('message', (rawMessage) => {
                let data;
                try {
                    data = JSON.parse(rawMessage.toString());
                } catch (err) {
                    console.error('Invalid JSON:', rawMessage.toString());
                    return;
                }
                if (data.type === 'chat') {
                    console.log("MSG");
                    broadcast({
                        type: 'chat',
                        sender: username,
                        message: data.message
                    });
                } 
                else if (data.type === 'matchmaking') {
                    if (waiting_list && w_uname !== username) {
                        const gameId = createGame(w_uname, username);
                        console.log(`Game created: ${gameId}`);

                        waiting_list.send(JSON.stringify({
                            type: 'matchmaking',
                            state: 'found',
                            gameId: gameId,
                            role: 'left',
                            opponent: username
                        }));

                        socket.send(JSON.stringify({
                            type: 'matchmaking',
                            state: 'found',
                            gameId: gameId,
                            role: 'right',
                            opponent: w_uname
                        }));

                        // Sur deconnexion
                        socket.on('close', () => {
                            games[gameId].scores["left"] = 11;
                        });
                        waiting_list.on('close', () => {
                            games[gameId].scores["right"] = 11;
                        });

                        waiting_list = null;
                        w_uname = null;
                    } else {
                        waiting_list = socket;
                        w_uname = username;
                        console.log(`${username} is waiting for a match.`);
                    }
                }
            });

            sendInfosFriends(socket, username, "connection");
            connectedClients.set(socket, username);
        });
    });
}

export default websocketRoute;