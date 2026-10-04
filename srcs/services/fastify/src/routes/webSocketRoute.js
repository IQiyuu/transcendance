import { games, createGame, gameSockets } from './gameState.js';


async function websocketRoute(fastify, options) {
    const db = options.db;
    let waiting_list = null;
    let w_uname = null;
    const connectedClients = new Map();   // username -> socket

    fastify.addHook('preValidation', async (request, reply) => {
        if (request.routerPath === '/ws' && !request.query.username) {
            return reply.code(403).send('Connection rejected: missing username');
        }
    });

    // Amis acceptés d'un utilisateur (dans les deux sens de la relation)
    function getFriendList(username) {
        return db.prepare(`
            SELECT u.username
            FROM friends f
            JOIN users me ON me.username = ?
            JOIN users u ON u.user_id = CASE WHEN f.user_id = me.user_id
                                             THEN f.friend_id ELSE f.user_id END
            WHERE (f.user_id = me.user_id OR f.friend_id = me.user_id)
              AND f.status = 'accepted'
        `).all(username);
    }

    fastify.register(async function (fastify) {
        fastify.get('/ws', { websocket: true }, (socket, req) => {
            const username = req.query.username;

            // Diffuser un message à tout le monde
            function broadcast(message) {
                for (const client of connectedClients.values()) {
                    if (client.readyState === 1)
                        client.send(JSON.stringify(message));
                }
            }

            function sendInfosFriends(socket, username, type) {
                const friendlist = getFriendList(username);
                for (const friend of friendlist) {
                    const friendSocket = connectedClients.get(friend.username);
                    if (friendSocket && friendSocket !== socket) {
                        if (friendSocket.readyState === 1)
                            friendSocket.send(JSON.stringify({ type, user: username }));
                        if (socket.readyState === 1)
                            socket.send(JSON.stringify({ type, user: friend.username }));
                    }
                }
            }

            // Quand un user ferme sa connexion
            socket.on('close', () => {
                if (waiting_list === socket) {
                    waiting_list = null;
                    w_uname = null;
                }
                if (connectedClients.get(username) === socket)
                    connectedClients.delete(username);
                sendInfosFriends(socket, username, "disconnection");
            });

            // Quand un message arrive
                        // Quand un message arrive
            socket.on('message', (rawMessage) => {
                try {
                    const data = JSON.parse(rawMessage.toString());

                    if (data.type === 'chat') {
                        broadcast({ type: 'chat', sender: username, message: data.message });

                    } else if (data.type === 'addFriend' || data.type === 'removeFriend') {
                        const targetSocket = connectedClients.get(data.target);
                        if (targetSocket && targetSocket.readyState === 1)
                            targetSocket.send(JSON.stringify(data));

                    } else if (data.type === 'matchmaking') {
                        if (data.state === 'enter') {
                            if (waiting_list === null) {
                                waiting_list = socket;
                                w_uname = data.uname;
                            } else if (w_uname !== data.uname) {
                                const leftSocket = waiting_list;
                                const leftName = w_uname;
                                waiting_list = null;
                                w_uname = null;

                                const gameId = createGame(leftName, data.uname);
                                gameSockets.set(gameId, { left: leftSocket, right: socket });
                                leftSocket.send(JSON.stringify({
                                    type: 'matchmaking', state: 'found',
                                    gameId, role: 'left', opponent: data.uname
                                }));
                                socket.send(JSON.stringify({
                                    type: 'matchmaking', state: 'found',
                                    gameId, role: 'right', opponent: leftName
                                }));

                                socket.on('close', () => {
                                    if (games[gameId]) games[gameId].scores.left = 11;
                                });
                                leftSocket.on('close', () => {
                                    if (games[gameId]) games[gameId].scores.right = 11;
                                });
                            }
                        } else if (data.state === 'left' && waiting_list === socket) {
                            waiting_list = null;
                            w_uname = null;
                        }

                    } else if (data.type === 'input') {
                        // en ligne : le rôle est déduit de la socket, pas de ce que dit le client
                        const game = games[data.gameId];
                        const s = game && gameSockets.get(game.id);
                        if (s) {
                            const side = s.left === socket ? 'left' : s.right === socket ? 'right' : null;
                            if (side) {
                                game.inputs ??= {};
                                game.inputs[side] = { up: !!data.up, down: !!data.down };
                            }
                        }

                    } else if (data.type === 'localInput') {
                        const game = games[data.gameId];
                        if (game && game.players.left === username) {
                            if (!gameSockets.has(game.id))
                                gameSockets.set(game.id, { left: socket, right: socket });
                            game.inputs = {
                                left:  { up: !!data.left?.up,  down: !!data.left?.down },
                                right: { up: !!data.right?.up, down: !!data.right?.down },
                            };
                        }
                    }
                } catch (err) {
                    fastify.log.error(err);
                }
            });

            sendInfosFriends(socket, username, "connection");
            connectedClients.set(username, socket);
        });
    });
}

export default websocketRoute;