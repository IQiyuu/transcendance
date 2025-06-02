
import * as gameRoute from "./gameRoute.js"; // relative to this file
import fastifyPlugin from 'fastify-plugin';

import { request } from "node:http";

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

            // console.log(`${username} connected.`);

            // Diffuser un message à tout le monde
            function broadcast(message) {
                for (const [socket, username] of connectedClients) {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify(message));
                    }
                }
            }
            
            function sendInfosFriends(socket, username, type) {
                const friendlist = getFriendList(username);
            
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
                if (data.type === 'chat') {
                    broadcast({
                        type: 'chat',
                        sender: username,
                        message: data.message
                    });
                } if (data.type === 'addFriend' || data.type === 'removeFriend') {
                    const targetSocket = connectedClients.get(data.target);
                    if (targetSocket) {
                        targetSocket.send(JSON.stringify(data));
                    }
                } else if (data.type === 'matchmaking') {
                    if (data.state == 'enter' && waiting_list == null) {
                        waiting_list = socket;
                        w_uname = data.uname;
                    }
                    if (data.state == 'left') {
                        waiting_list = null;
                        w_uname = null;
                    }
                    if (waiting_list && w_uname !== data.uname) {
                        const gameId = gameRoute.createGame(w_uname, data.uname);
                        console.log(`Game created: ${gameId}`);
                        waiting_list.send(JSON.stringify({
                            type: 'matchmaking',
                            state: 'found',
                            gameId: gameId,
                            role: 'left',
                            opponent: data.uname
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
                            gameRoute.games[gameId].scores["left"] = 11;
                        });
                        waiting_list.on('close', () => {
                            gameRoute.games[gameId].scores["right"] = 11;
                        });
                    } 
                } else if (data.type === "disconnection") {
                    if (gameId != -1) {
                        // console.log(games[gameId]);
                        delete gameRoute.games[gameId];
                    }
                    // Client asking for game infos, instead of a fetch
                } else if (data.type === "game_info") {
                    // If valid
                    // ...
                    const targetSocket = connectedClients.get(data.target);
                    socket.send(JSON.stringify({
                        type: 'game_info',
                        game: game.games[data.game_id]
                    }));
                } else if (data.type === "game_update") {
                    //if Valid
                    //...
                    var game = game.games[data.game_id];
                    gameRoute.movePaddle(game, data.side, data.moveUp);
                }
            });

            sendInfosFriends(socket, username, "connection");
            connectedClients.set(username, socket);
        });
    });
}

export default fastifyPlugin(websocketRoute);
