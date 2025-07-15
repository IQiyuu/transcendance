
import { isAuthenticated } from "../server.js";
import * as gameRoute from "./gameRoute.js"; // relative to this file

let connectedClients = new Map();

export function isClientAlreadyConnected(username){
    return (connectedClients.has(username));
}

async function websocketRoute(fastify, options) {
    const db = options.db;
    let waiting_list = null;
    let w_uname = null;

    fastify.addHook('preValidation', async (request, reply) => {
        if (request.url.startsWith('/ws')){
            if (! await isAuthenticated(request, reply))
				return (reply.code(401).send({success: false, message: 'You need to be authenticated'}));
            if (request?.query?.username === undefined)
                reply.code(403).send('Connection rejected: missing username');
        }
    });

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

    function getIdFromUsername(username) {
        const data = db.prepare('SELECT user_id FROM users WHERE username = ?').get(username);
        if (data)
            return data.user_id;
        return "";
    }

    fastify.register(async function (fastify) {
        fastify.get('/ws', { websocket: true }, (socket, req) => {
            const username = req.query.username;

            function sendInfosFriends(socket, username, type) {
                const user_id = getIdFromUsername(username);
                if (user_id == "")
                    return ;
                const friendlist = getFriendList(user_id);
                for (let friend of friendlist) {
                    const friendSocket = connectedClients.get(friend.username);
            
                    if (friendSocket && friendSocket !== socket) {
                        // envoie a l'ami de celui qui vient de se co
                        friendSocket.send(JSON.stringify({
                            type,
                            user: username,
                        }));
                        // envoie a celui qui vient de se co
                        socket.send(JSON.stringify({
                            type,
                            user: friend.username,
                        }));
                    }
                }
            }

            function broadcast(data, username) {
                const user_id = getIdFromUsername(username);
                    if (user_id == "")
                        return ;
                    const friendlist = getFriendList(user_id);
                    for (let friend of friendlist) {
                        const friendSocket = connectedClients.get(friend.username);
                        if (friendSocket && friendSocket !== socket) {
                            friendSocket.send(JSON.stringify(data));
                        }
                    }
            }

            // Quand un user ferme sa connexion
            socket.on('close', (rawMessage) => {
                const data = JSON.parse(rawMessage.toString());
                if (data.gameId != -1) {
                    if (data.mod == 'l') {
                        delete games[data.gameId];
                    }
                }
                // Si le joueur attendait un match
                else if (waiting_list && w_uname === data.uname) {
                    waiting_list = null;
                    w_uname = null;
                }
                connectedClients.delete(username);
                sendInfosFriends(socket, username, "disconnection");
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
                if (data.type === 'addFriend' || data.type === 'removeFriend') {
                    const targetSocket = connectedClients.get(data.target);
                    if (targetSocket) {
                        targetSocket.send(JSON.stringify(data));
                    }
                } else if (data.type === 'pseudo_swap') {
                    broadcast({
                        type: data.type,
                        username: data.username,
                        newUsername: data.newUsername
                    }, data.newUsername);
                } else if (data.type === 'pp_swap') {
                    broadcast({
                        type: data.type,
                        username: data.username,
                        pp: data.pp
                    }, data.username);
                // } else if (data.type === 'matchmaking') {
                    // if (data.state == 'enter' && waiting_list == null) {
                    //     waiting_list = socket;
                    //     w_uname = data.uname;
                    // }
                    // if (data.state == 'left') {
                    //     waiting_list = null;
                    //     w_uname = null;
                    // }
                    // if (waiting_list && w_uname !== data.uname) {
                    //     const gameId = gameRoute.createGame(w_uname, data.uname);
                    //     // console.log(`Game created: ${gameId}`);
                    //     waiting_list.send(JSON.stringify({
                    //         type: 'matchmaking',
                    //         state: 'found',
                    //         gameId: gameId,
                    //         role: 'left',
                    //         opponent: data.uname
                    //     }));
                        
                    //     socket.send(JSON.stringify({
                    //         type: 'matchmaking',
                    //         state: 'found',
                    //         gameId: gameId,
                    //         role: 'right',
                    //         opponent: w_uname
                    //     }));

                        // // Sur deconnexion
                        // socket.on('close', () => {
                        //     gameRoute.games[gameId].scores["left"] = 11;
                        // });
                        // waiting_list.on('close', () => {
                        //     gameRoute.games[gameId].scores["right"] = 11;
                        // });
                    // } 
                // } else if (data.type === "disconnection") {
                //     if (gameId != -1) {
                //         delete gameRoute.games[gameId];
                //     }
                } else if (data.type == "initialized") {
                    sendInfosFriends(socket, username, "connection");
                }
            });

            connectedClients.set(username, socket);
        });
    });
}

export default websocketRoute;
