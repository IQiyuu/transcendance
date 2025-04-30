async function websocketRoute(fastify, options) {
    const db = options.db;
    let waiting_list = null;
    let w_uname = null;
<<<<<<< HEAD
    let connectedClients = new Map();
=======
<<<<<<<< HEAD:fastify/src/webSocketRoute.js
    const connectedClients = new Map();
========
    let connectedClients = new Map();
>>>>>>>> daca160cd07c47da8b499e19eb3e97a24cca2516:srcs/services/fastify/src/webSocketRoute.js
>>>>>>> daca160cd07c47da8b499e19eb3e97a24cca2516

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
<<<<<<< HEAD

            // Diffuser un message à tout le monde
            function broadcast(message) {
=======
            connectedClients.set(socket, username);

            // Diffuser un message à tout le monde
            function broadcast(message) {
<<<<<<<< HEAD:fastify/src/webSocketRoute.js
                for (const [socket, username] of connectedClients) {
                    socket.send(JSON.stringify(message));
========
>>>>>>> daca160cd07c47da8b499e19eb3e97a24cca2516
                for (let client of fastify.websocketServer.clients) {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify(message));
                    }
<<<<<<< HEAD
=======
>>>>>>>> daca160cd07c47da8b499e19eb3e97a24cca2516:srcs/services/fastify/src/webSocketRoute.js
>>>>>>> daca160cd07c47da8b499e19eb3e97a24cca2516
                }
            }

            function sendInfosFriends(socket, username, t) {
                const friendlist = getFriendList(username);
            
                for (let friend of friendlist) {
                    for (let [sock, uname] of connectedClients.entries()) {
                        if (uname === friend.username) {
                            sock.send(JSON.stringify({
<<<<<<< HEAD
                                type: t,
                                user: uname,
=======
                                type: 'connection',
                                user: t,
>>>>>>> daca160cd07c47da8b499e19eb3e97a24cca2516
                            }));
                        }
                    }
                }
                socket.send({
                    type: "friendlist",
                    friendlist: friendlist
                });
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
<<<<<<< HEAD

=======
                console.log(data);
>>>>>>> daca160cd07c47da8b499e19eb3e97a24cca2516
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

<<<<<<< HEAD
                        // Sur déconnexion
=======
                        // Sur deconnexion
>>>>>>> daca160cd07c47da8b499e19eb3e97a24cca2516
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

<<<<<<< HEAD
            sendInfosFriends(socket, username, "connection");
            connectedClients.set(socket, username);
=======
<<<<<<<< HEAD:fastify/src/webSocketRoute.js
            // Quand quelqu'un arrive, envoyer un message serveur
            broadcast({
                type: 'connexion',
                user: username,
            });
========
            sendInfosFriends(socket, username, "connection");
            connectedClients.set(socket, username);
>>>>>>>> daca160cd07c47da8b499e19eb3e97a24cca2516:srcs/services/fastify/src/webSocketRoute.js
>>>>>>> daca160cd07c47da8b499e19eb3e97a24cca2516
        });
    });
}

export default websocketRoute;