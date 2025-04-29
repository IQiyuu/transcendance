async function websocketRoute(fastify, options) {
    let waiting_list = null;
    let w_uname = null;
    const connectedClients = new Map();

    fastify.addHook('preValidation', async (request, reply) => {
        if (request.routerPath === '/ws' && !request.query.username) {
            reply.code(403).send('Connection rejected: missing username');
        }
    });

    fastify.register(async function (fastify) {
        fastify.get('/ws', { websocket: true }, (socket, req) => {
            const username = req.query.username;

            console.log(`${username} connected.`);
            connectedClients.set(socket, username);

            // Diffuser un message à tout le monde
            function broadcast(message) {
                for (const [socket, username] of connectedClients) {
                    socket.send(JSON.stringify(message));
                }
            }

            // Quand un user ferme sa connexion
            socket.on('close', () => {
                console.log(`${username} disconnected.`);
                broadcast({
                    type: 'chat',
                    sender: '__server',
                    message: `${username} left the chat.`,
                });

                // Si le joueur attendait un match
                if (waiting_list && w_uname === username) {
                    waiting_list = null;
                    w_uname = null;
                }
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
                console.log(data);
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

            // Quand quelqu'un arrive, envoyer un message serveur
            broadcast({
                type: 'connexion',
                user: username,
            });
        });
    });
}

export default websocketRoute;