import {matchOver} from './tournament.js';

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function degToRad(degree){
    return ((degree * Math.PI) / 180)
}

// Each position is the center of the object

const	SCORE_GOAL = 5;
const	STARTING_SPEED = 7;
const	ACCELERATION = 1;
const	LIMIT_SPEED = 12;
const	BOARD_W = 700;
const	BOARD_H = 480;

const   PADDLE_W = 10;
const   PADDLE_H = 80;

const   BALL_W = 10;

const	STARTING_X = BOARD_W / 2;
const	STARTING_Y = BOARD_H / 2;

export let games = [];
var gameId = 0;
const finished_games = [];

/**
 * Clients are put in the waiting map on connection, then are moved to the playing when the game start
 */
let waiting_clients = new Map(); // username, socket
let playing_clients = new Map(); // socket, game_id as we may have 2 socket for the same game_id

// Creer un objet game cote server
export function createGame(user, user2, t_id = null) {
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
                const angle = degToRad(0);
                const neg_x = randomIntFromInterval(0,1);
                this.dx = Math.cos(angle) * (neg_x ? -1 : 1);
                this.dy = Math.sin(angle);
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
    gameId++;
    return gameId - 1;
};

function movePaddle(game, side, moveUp){
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
    const winner_score = game.scores.left < game.scores.right ? game.scores.right : game.scores.left;

    try {
        const insert = db.prepare(`
            INSERT INTO games (winner_id, loser_id, loser_score, winner_score) 
                SELECT
                    u1.user_id AS winner_id,
                    u2.user_id AS loser_id, 
                    ? AS loser_score,
                    ? AS winner_score
                FROM users u1, users u2 
                WHERE u1.username = ? AND u2.username = ?`
        );
        insert.run(loser_score, winner_score, winner, loser);
        return true;
    } catch (error) {
        console.error('Error insert data in db.', error);
        return false;
    }
}

function    getGameByUsername(gs, username){
    for (let i = 0; i < gs.length; i++){
        if (gs[i].players.left === username || gs[i].players.right === username)
            return (gs[i].id);
    }
    return (-1)
}

export function    getGameByID(id){
    let game = games.find(x => x.id === id);
    return game;
}

// Returns a masked view of the game
function    getMaskedGame(game){
    // console.log(game);
    if (game === undefined)
        return game;
    let g = {
        id: game.id,
        t_id: game.t_id,
        players: {
            left: game.players.left,
            right: game.players.right
        },
        scores: {
            left: game.scores.left,
            right: game.scores.right
        },
        ball: {
            x: game.ball.x,
            y: game.ball.y,
        },
        paddles: {
            left: {
                x: game.paddles.left.x,
                y: game.paddles.left.y
            },
            right: {
                x: game.paddles.right.x,
                y: game.paddles.right.y
            }
        }
    }
    return (g);
}

function    getSecondPlayer(clients, p1, game_id){
    console.log("Trying to get 2nd player");
    let res = undefined;
    clients.forEach((socket, g_id) => {
        if (socket != p1 && g_id == game_id){
            res = socket;
        }
    });
    return (res);
}
export async function gameRoute (fastify, options) {

    const amIInGame = async (request, reply) => {
        const { id } = request.body.id;

        if (id == null)
            id = request.params.id;

        if (id == null)
            return reply.send({ success: false, error: "id error" });

        const game = games[id];
        if (!game)
            return reply.send({ success: false, error: "id error" });

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
                if (!(game.players.right == decoded.username || game.players.left == decoded.username))
                    throw Error("Not authorized3");
            } catch (error) {
                return reply.send({ success: false, error: error.message });
            }
        } catch (error) {
            return reply.send({ success: false, error: error.message });
        }
    };

    //Stop a game, to update
    fastify.post('/game/stopGame', async (req, reply) => {
        delete getGameByID(req.body.gameId); // to change
    });

    fastify.post('/game/local/create', async (req, reply) => {
        const id = createGame(req.body.username, req.body.username+"-2");
        return ({success: true, id: id});
    });

    // Route qui renvoie les infos de la game
    fastify.get('/game/:id', {
        preHandler: amIInGame
    }, async (request, reply) => {
        const game = getGameByID(request_params.id);
        if (!game) return reply.status(404).send({ error: 'Game not found' });
        return game;
    });

    // Route qui change les coordonnees du joueur qui bouge
    fastify.post('/game/:id/move', {
        preHandler: amIInGame
    }, async (request, reply) => {
        var game = getGameByID(request_params.id);
        var newY = game.paddles[request.body.role].y + (request.body.moveUp ? -4 : 4);
        if (newY > 120 && newY < 580)
            game.paddles[request.body.role].y = newY;
    })

    // Route qui change les coordonnees du joueur qui bouge
    fastify.post('/game/local/:id/move', {
        preHandler: amIInGame
    }, async (request, reply) => {
        var game = getGameByID(request_params.id);
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
                console.log(" IF PRINTED, YOU NEED TO SEE WHY socket game connection for");
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
                if (message.type === "create_game_offline"){
                    let new_game_id = createGame(message.username, message.username + "-2");
                    // console.log(games);
                    // console.log("Ceating a solos game");

                    // NE PAS OUBLIER DE MASKER AVEC UN HOOK
                    // console.log(getMaskedGame(getGameByID(new_game_id)));
                    socket.send(JSON.stringify({
                        type: "offline_game_created",
                        game: getMaskedGame(getGameByID(new_game_id)),
                        game_id: new_game_id // useless
                    }));
                    playing_clients.set(socket, new_game_id);
                    waiting_clients.delete(username);
                } else if (message.type === "game_update"){
                    let game = getGameByID(message.game_id);
                    if (game === undefined){
                        console.log("error, game dosnt exists");
                        return ;
                    }
                    movePaddle(game, message.side, message.move_up);

                } else if (message.type === "matchmaking"){
                    if (message.state === "join"){
                        console.log("A player is joining matchmaking");
                        if (waiting_clients.size > 0){
                            console.log("Match found");
                            //We take the 1st player that joined the queue
                            let second_player_name = waiting_clients.keys().next().value;
                            let second_player_socket = waiting_clients.get(second_player_name);
                            let new_game_id = createGame(message.username, second_player_name);
                            let game = getMaskedGame(getGameByID(new_game_id));
                            console.log(game);
                            console.log(second_player_name);

                            socket.send(JSON.stringify({
                                type: 'matchmaking',
                                state: 'found',
                                game: getMaskedGame(game),
                                game_id: new_game_id
                            }));

                            second_player_socket.send(JSON.stringify({
                                type: 'matchmaking',
                                state: 'found',
                                game: getMaskedGame(game),
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
                        let game_id = getGameByUsername(games, username);
                        if (game_id === -1){
                            console.log("Error");
                            socket.send(JSON.stringify({
                                type: 'tournament',
                                success: false,
                                message: "User isnt in a match"
                            }));
                        }else {
                            console.log("THE GAME");
                            console.log(getMaskedGame(getGameByID(game_id)));
                            socket.send(JSON.stringify({
                                type: 'tournament',
                                success: true,
                                state: 'match_connected',
                                game: getMaskedGame(getGameByID(game_id)),
                                game_id: game_id // useless
                            }));
                            playing_clients.set(socket, game_id);
                        }
                    }
                }
            })

            socket.on('close', (event) => {
                //If player is in game
                console.log("closing game client socket");

                if (playing_clients.has(socket)){
                    let game = getGameByID(playing_clients.get(socket));
                    if (game !== undefined){
                        game.scores[(username === game.players.left ? "left" : "right")] = -1;
                        finished_games.push(game);
                    }
                }
        
                //If player is in the waiting list
                if (waiting_clients.has(socket)){
                    console.log("a player is leaving matchmaking");
                    waiting_clients.delete(socket);
                }
                socket.close();
                console.log("player socket closed");
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
                if (dist > (3 * (PADDLE_H / 2)) / 4)
                    angle += 45;
                else if (dist > (2 * (PADDLE_H / 2)) / 4)
                    angle += 65;
                else if (dist > (PADDLE_H / 2) / 4)
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
                if (dist > (3 * (PADDLE_H / 2)) / 4)
                    angle += 45;
                else if (dist > (2 * (PADDLE_H / 2)) / 4)
                    angle += 65;
                else if (dist > (PADDLE_H / 2) / 4)
                    angle += 80;
                else
                    angle += 90;

                game.ball.dx = Math.cos(degToRad(angle));
                game.ball.dy = Math.sin(degToRad(angle)) * sign;
                game.ball.accelerate();
            }
            // checking with centers of objects
            if (game.ball.x < game.paddles.left.x || game.ball.x > game.paddles.right.x) {
                game.scores[game.ball.x < game.paddles.left.x ? "right" : "left"]++;
                game.ball.v = STARTING_SPEED;
                game.ball.x = STARTING_X;
                game.ball.y = STARTING_Y;
                game.ball.randomizeVector();
            }
            game.ball.x += game.ball.dx * game.ball.v;
            game.ball.y += game.ball.dy * game.ball.v;
        });

        // For every player still playing
        playing_clients.forEach((game_id, sock) => {
            let game = getGameByID(game_id);
            if (game === undefined)
                return ;

            // If their game is finished, we end it
            if (finished_games.includes(game)){
                let p2 = null;
                playing_clients.forEach((g_id2, sock2) => {
                    if (g_id2 === game_id && sock2 != sock)
                        p2 = sock2;
                });
                // Game to be closed client side for p2, also, here I have to check game
                console.log("GAME is finished");
                console.log(game);
                if (game.t_id !== null){
                    matchOver(game, (sock.readyState === sock.CLOSED || sock.readyState === sock.CLOSING)); 
                }

                if (sock.readyState === sock.OPEN){
                    sock.send(JSON.stringify({
                        type: "game_finished",
                        game: getMaskedGame(game)
                    }));
                }

                playing_clients.delete(sock);
                if (p2 !== null){
                    // console.log("p2 found !");
                    p2.send(JSON.stringify({
                        type: "game_finished",
                        game: getMaskedGame(game)
                    }));
                    playing_clients.delete(p2);
                }

                saveGame(game, options.db);
                games.splice(games.indexOf(game), 1);
                finished_games.splice(finished_games.indexOf(game), 1);
            } else { // else, we send infos
                sock.send(JSON.stringify({
                    type: "game_info",
                    game: getMaskedGame(game)
                }));
            }
        });
    }, 30);

}

export default gameRoute;