import fs from 'fs';
import {gameInTournament, matchOver} from './tournament.js';
import { finished } from 'stream';

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function degToRad(degree){
    return ((degree * Math.PI) / 180)
}

// Each position is the center of the object

const	SCORE_GOAL = 11;
const	STARTING_SPEED = 10;
const	ACCELERATION = 1;
const	LIMIT_SPEED = 15;
const	BOARD_W = 700;
const	BOARD_H = 480;

const   PADDLE_W = 10;
const   PADDLE_H = 80;

const   BALL_W = 10;

const	STARTING_X = BOARD_W / 2;
const	STARTING_Y = BOARD_H / 2;

export let games = [];
const finished_games = [];

/**
 * Clients are put in the waiting map on connection, then are moved to the playing when the game start
 */
let waiting_clients = new Map(); // username, socket
let playing_clients = new Map(); // socket, game_id as we may have 2 socket for the same game_id

// Creer un objet game cote server
export function createGame(user, user2, t_id = null) {
    const gameId = games.length;
    const angle = degToRad(randomIntFromInterval(0, 45));
    if (randomIntFromInterval(0,1) === 0){
        let tmp = user;
        user = user2;
        user2 = tmp;
    }
    const neg_x = randomIntFromInterval(0,1), neg_y = randomIntFromInterval(0,1);
    games.push({
        id: gameId,
        t_id: t_id,
        players: {  
            left: user,
            right: user2
        },
        scores: {
            left: 0,
            right: 0
        },
        ball: {
            x: STARTING_X,
            y: STARTING_Y,
            dx: Math.cos(angle) * (neg_x ? -1 : 1),
            dy: Math.sin(angle) * (neg_y ? -1 : 1),
            dist: -1,
            v: STARTING_SPEED,
            accelerate: function() {
                if (this.v < LIMIT_SPEED)
                    this.v += ACCELERATION;
            },
            randomizeVector: function() {
                const angle = degToRad(randomIntFromInterval(0, 45));
                const neg_x = randomIntFromInterval(0,1), neg_y = randomIntFromInterval(0,1);
                this.dx = Math.cos(angle) * (neg_x ? -1 : 1);
                this.dy = Math.sin(angle) * (neg_y ? -1 : 1);
            }
        },
        paddles: {
            left: {
                x: 10,
                y: STARTING_Y
            },
            right: {
                x: BOARD_W - 10,
                y: STARTING_Y
            }
        }
    });
    return gameId;
};

//why export ?
export function movePaddle(game, side, moveUp){
    if (side !== "left" && side !== "right")
        return ;
    let new_y = (game.paddles[side].y) + (moveUp ? -4 : 4);
    if (new_y - (PADDLE_H / 2) > 20 && new_y + (PADDLE_H / 2) < BOARD_H - 20)
        game.paddles[side].y = new_y;
}

export function userExistsInDb(username, db){
    let req = db.prepare("SELECT username FROM users WHERE username = ?").get(username);
    return (req !== null && req !== undefined);
}

export function addPlayingClients(p1, p2, id){
    // console.log(p1);
    // console.log(p2);
    playing_clients.set(p1.socket, id);
    playing_clients.set(p2.socket, id);
}

//Save a game into the db
function    saveGame(game, db){
    const winner = (game.scores.left < game.scores.right) ? game.players.right : game.players.left;
    const loser = (winner === game.players.left) ? game.players.right : game.players.left;
    const loser_score = game.scores.left > game.scores.right ? game.scores.right : game.scores.left;

    try {
        const insert = db.prepare(`
            INSERT INTO games (winner_id, loser_id, loser_score) 
                SELECT
                    u1.user_id AS winner_id,
                    u2.user_id AS loser_id, 
                    ? AS loser_score 
                FROM users u1, users u2 
                WHERE u1.username = ? AND u2.username = ?`
        );
        insert.run(loser_score, winner, loser);
        return true;
    } catch (error) {
        console.error('Error insert data in db.', error);
        return false;
    }
}

function    getGame(gs, username){
    for (let i = 0; i < gs.length; i++){
        if (gs[i].players.left === username || gs[i].players.right === username)
            return (gs[i].id);
    }
    return (-1)
}

export async function gameRoute (fastify, options) {
    // let waiting_list = null;
    // let w_uname = null;
    let img_path = "dist/assets/imgs/"; //to update 


    // Stocke la game dans la db
    fastify.post('/game/storeGame', async (request, reply) => {
        const { winner_username, loser_username, loser_score } = request.body;
        // saveGame();
        try {
            const insert = options.db.prepare(`
                INSERT INTO games (winner_id, loser_id, loser_score) 
                    SELECT
                        u1.user_id AS winner_id,
                        u2.user_id AS loser_id, 
                        ? AS loser_score 
                    FROM users u1, users u2 
                    WHERE u1.username = ? AND u2.username = ?`
            );
            insert.run(loser_score, winner_username, loser_username);
            console.log("REGISTER");
            return { success: true, message: `Game registered` };
        } catch (error) {
            console.error('Error insert data in db.', error);
            return { success: false, error: error };
        }
    });

    fastify.post('/game/stopGame', async (req, reply) => {
        delete games[req.body.gameId]; // to update
    });

    // Route qui recupere les infos du user :username dans la db et les renvoie
    fastify.get('/profile/:username', async (request, reply) => {
        try {
            const username = request.params.username;
            // console.log(username);
            // ajouter l'image de profile
            if (!userExistsInDb(username, options.db))
                return {success: false, message: "User doesn't exists"};
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

    // Pareil que au dessus avec les games
    fastify.get('/historic/:username', async (request, reply) => {

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

    // Route qui modifie la photo de profile ../assets/imgs et change le path dans la db
    fastify.post('/upload/picture/:username', async (request, reply) => {
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

    // Route qui recupere une game l'upload dans ./dist/img et change le path dans la db
    fastify.post('/upload/username/:username', async (request, reply) => {
        const { username, newusername } = request.body;
        // console.log(username);
        
        if (newusername == username) {
            return { success: false, message: 'Same username' };
        }
        if (newusername.length <= 3) {
            return { success: false, message: 'Username too small' };
        }

        if (newusername.length >= 15) {
            return { success: false, message: 'Username too long' };
        }
        try {
            const data = options.db.prepare('SELECT username FROM users WHERE username = ?').get(newusername);
            if (data != undefined)
                return { success: false, message: 'Username already taken' };
        } catch (error) {
            console.error('Error db.', error);
            return { success: false, message: 'Error db' };
        }
        try {
            options.db.prepare('UPDATE users SET username = ? WHERE username = ?').run(newusername, username);
                
            // console.log('Username modified in db for: ', newusername);
            return { success: true, message: 'Username uploaded' };
        } catch (error) {
            console.error('Error updating data in db.', error);
            return { success: false, message: 'Error updating data in db' };
        }
    });

    fastify.post('/game/local/create', async (req, reply) => {
        const id = createGame(req.body.username, req.body.username+"-2");
        return ({success: true, id: id});
    });

    // Route qui renvoie les infos de la game
    fastify.get('/game/:id', async (request, reply) => {
        const game = games[request.params.id];
        if (!game) return reply.status(404).send({ error: 'Game not found' });
        return game;
    });

    // Route qui change les coordonnees du joueur qui bouge
    fastify.post('/game/:id/move', async (request, reply) => {
        var game = games[request.params.id];
        var newY = game.paddles[request.body.role].y + (request.body.moveUp ? -4 : 4);
        if (newY > 120 && newY < 580)
            game.paddles[request.body.role].y = newY;
    })

    // Route qui change les coordonnees du joueur qui bouge
    fastify.post('/game/local/:id/move', async (request, reply) => {
        var game = games[request.params.id];
        if (request.body.moveRight != null)
            var newY1 = game.paddles["right"].y + (request.body.moveRight ? -4 : 4);
            if (newY1 > 0 && newY1 < 400)
                game.paddles["right"].y = newY1;

        if (request.body.moveLeft != null)
            var newY2 = game.paddles["left"].y + (request.body.moveLeft ? -4 : 4);
            if (newY2 > 0 && newY2 < 400)
                game.paddles["left"].y = newY2;
    })

    // Sub plugin for ws games;
    fastify.register(async function (fastify) {
        fastify.addHook("preValidation", async (request, reply) => {
            //Verification of the request
        });

        fastify.get('/game/ws', { websocket: true }, (socket, req) => {
            let username = req.query.username;
            socket.on('open', (event) => {
                // PROBLEM ; I dont know when this is executed
                console.log("socket game created for");
                console.log(username);
                // waiting_clients.set(username, socket);
            });
            
            socket.on('message', (data) => {
                let message;
                try {
                    message = JSON.parse(data.toString());
                } catch (err) {
                    console.error('Invalid JSON:', data.toString());
                    return;
                }
                // console.log("Receiving :");
                // console.log(message);
                if (message.type === "create_game_offline"){
                    let new_game_id = createGame(message.username, message.username + "-2");
                    // NE PAS OUBLIER DE MASKER AVEC UN HOOK
                    socket.send(JSON.stringify({
                        type: "offline_game_created",
                        game: games[new_game_id], 
                        game_id: new_game_id
                    }));
                    playing_clients.set(socket, new_game_id);
                    waiting_clients.delete(username);
                } else if (message.type === "game_update"){
                    let game = games[message.game_id];
                    //to check ?
                    if (game === undefined)
                        return ;
                    movePaddle(game, message.side, message.move_up);

                    // if (newY > 15 && newY < BOARD_H - 15)
                    //     game.paddles[message.side].y = newY;
                } else if (message.type === "matchmaking"){
                    if (message.state === "join"){
                        console.log("A player is joining matchmaking");
                        if (waiting_clients.size > 0){
                            console.log("Match found");
                            //We take the 1st player that joined the queue
                            let second_player_name = waiting_clients.keys().next().value;
                            let second_player_socket = waiting_clients.get(second_player_name);
                            let new_game_id = createGame(message.username, second_player_name);

                            socket.send(JSON.stringify({
                                type: 'matchmaking',
                                state: 'found',
                                game: games[new_game_id],
                                game_id: new_game_id
                            }));

                            second_player_socket.send(JSON.stringify({
                                type: 'matchmaking',
                                state: 'found',
                                game: games[new_game_id],
                                game_id: new_game_id
                            }));

                            playing_clients.set(socket, new_game_id);
                            playing_clients.set(second_player_socket, new_game_id);
                            waiting_clients.delete(second_player_name);
                        }
                        else{
                            waiting_clients.set(message.username, socket);
                        }
                    } else if (message.state === "leave"){
                        console.log("A player is leaving matchmaking");
                        // if (isValid)
                        waiting_clients.forEach((sck, username) => {
                            if (sck === socket)
                                waiting_clients.delete(username);
                        });
                        socket.close();
                    }
                } else if (message.type === "tournament"){
                    console.log("tournament msg");
                    if (message.state === "connecting_match"){
                        console.log("Client is connecting");
                        let game_id = getGame(games, username);
                        if (game_id === -1){
                            console.log("Error");
                            socket.send(JSON.stringify({
                                type: 'tournament',
                                success: false,
                                message: "User isnt in a match"
                            }));
                        }else {
                            socket.send(JSON.stringify({
                                type: 'tournament',
                                success: true,
                                state: 'match_connected',
                                game: games[game_id],
                                game_id: game_id
                            }));
                            playing_clients.set(socket, game_id);
                        }
                    }
                }
            })

            socket.on('close', (event) => {
                //If game is active, tell users the game is over

                //At least, closing properly and removing from maps
                console.log("Closing  socket");
                // console.log(socket);
                playing_clients.delete(socket);
                waiting_clients.forEach((sck, username) => {
                    if (sck === socket)
                        waiting_clients.delete(username);
                });
            });
        });
    });


    /**
     * For paddles collisions, we check that the ball center for y touch the paddle
     *  For x, we check that there is a contact
     */
    setInterval(() => {
    
        Object.values(games).forEach(game => {

            if (game.scores.left >= SCORE_GOAL || game.scores.right >= SCORE_GOAL){
                finished_games.push(game);
                return ;
            }

            if (game.ball.y - (BALL_W / 2) <= 0 || game.ball.y + (BALL_W / 2) >= BOARD_H)
                game.ball.dy *= -1;

            if (game.ball.x - (BALL_W / 2) <= game.paddles.left.x + (PADDLE_W / 2)
                && game.ball.y >= game.paddles.left.y - (PADDLE_H / 2)
                && game.ball.y <= game.paddles.left.y + (PADDLE_H / 2)) {
                // There are 8 zone considered for the bouncing, so we round to the closest quarter
                let dist = Math.abs(game.ball.y - game.paddles.left.y);
                let sign = game.ball.dy < 0 ? -1 : 1; // test if vector is neg
                let angle = 90;
                if (dist > (3 * 50) / 4)
                    angle += 45;
                else if (dist > (2 * 50) / 4)
                    angle += 65;
                else if (dist > 50 / 4)
                    angle += 80;
                else
                    angle += 90;

                game.ball.dx = Math.cos(degToRad(angle)) * -1;
                game.ball.dy = Math.sin(degToRad(angle)) * sign;
                game.ball.accelerate();
            } else if (game.ball.x + (BALL_W / 2) >= game.paddles.right.x - (PADDLE_W / 2)
                && game.ball.y >= game.paddles.right.y - (PADDLE_H / 2)
                && game.ball.y <= game.paddles.right.y + (PADDLE_H / 2)) {
                // There are 8 zone considered for the bouncing, so we round to the closest quarter
                let dist = Math.abs(game.ball.y - game.paddles.right.y);
                let sign = game.ball.dy < 0 ? -1 : 1;
                let angle = 90;
                if (dist > (3 * 50) / 4)
                    angle += 45;
                else if (dist > (2 * 50) / 4)
                    angle += 65;
                else if (dist > 50 / 4)
                    angle += 80;
                else
                    angle += 90;

                game.ball.dx = Math.cos(degToRad(angle));
                game.ball.dy = Math.sin(degToRad(angle)) * sign;
                game.ball.accelerate();
            }
            // checking with centers of objects
            if (game.ball.x <= game.paddles.left.x || game.ball.x >= game.paddles.right.x) {
                game.scores[game.ball.x <= game.paddles.left.x ? "right" : "left"]++;
                game.ball.v = STARTING_SPEED;
                game.ball.x = STARTING_X;
                game.ball.y = STARTING_Y;
                game.ball.randomizeVector();
            }
            game.ball.x += game.ball.dx * game.ball.v;
            game.ball.y += game.ball.dy * game.ball.v;
        });

        for (var [socket, game_id] of playing_clients){
            let game = finished_games.find(g => g.id === game_id);

            // If game is finished, end
            if (game !== undefined){
                console.log("game is finished");
                console.log(game);

                playing_clients.delete(socket);

                let p2 = null; // can be null as there are local games too
                for (var [s2, g_id2] of playing_clients){
                    if (game_id === g_id2){
                        p2 = s2;
                        break ;
                    }
                }

                if (game.t_id !== null){
                    console.log("We are descending")
                    matchOver(game); // tell tournaments that a match is over
                }

                socket.send(JSON.stringify({
                    type: "game_finished",
                    game: game
                }));

                if (p2 !== null){
                    p2.send(JSON.stringify({
                        type: "game_finished",
                        game: game
                    }));
                    playing_clients.delete(p2);
                }
                
                saveGame(game, options.db);
                games.splice(games.indexOf(game), 1);
                finished_games.splice(finished_games.indexOf(game), 1);
                return ;
            }
            // Else, send info to users
            game = games.find(g => g.id === game_id);
            if (game !== undefined){
                // NE PAS OUBLIER DE MASKER AVEC UN HOOK
                socket.send(JSON.stringify({
                    type: "game_info",
                    game: game
                }));
            }
        }
    }, 30);

}

export default gameRoute;