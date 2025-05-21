import fs from 'fs';
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

async function gameRoute (fastify, options) {
    let games = {};
    let waiting_list = null;
    let w_uname = null;
    let img_path = "assets/imgs/";

    // Creer un objet game cote server
    function createGame(l_name, r_name) {
        const gameId = Object.keys(games).length;
        console.log(gameId);
        const neg = randomIntFromInterval(0,1);
        const vx = randomIntFromInterval(5, 8) * (neg ? -1 : 1);
        console.log(gameId);
        games[gameId] = {
            id: gameId,
            players: {
                left: l_name,
                right: r_name
            },
            scores: {
                left: 0,
                right: 0
            },
            ball: {
                x: 350,
                y: 250,
                vx: vx,
                vy: 10-Math.abs(vx)*(randomIntFromInterval(0,1) ? -1 : 1)
            },
            paddles: {
                left: {
                    x: 10,
                    y: 300
                },
                right: {
                    x: 680,
                    y: 300
                }
            }
        }
        return gameId;
    };

    // Stocke la game dans la db
    fastify.post('/game/storeGame', async (request, reply) => {
        const { winner_username, loser_username, loser_score } = request.body;
        console.log("LOL ", winner_username, " VS ", loser_username, loser_score);
        try {
            console.log(winner_username, loser_username);
            const insert = options.db.prepare('INSERT INTO games (winner_id, loser_id, loser_score) SELECT u1.user_id AS winner_id, u2.user_id AS loser_id, ? AS loser_score FROM users u1, users u2 WHERE u1.username = ? AND u2.username = ?');
            insert.run(loser_score, winner_username, loser_username);

            console.log(`Game registered to db`);
            return { success: true, message: `Game registered` };
        } catch (error) {
            console.error('Error insert data in db.', error);
            return { success: false, message: 'Error insert data in db.' };
        }
    });

    fastify.post('/game/stopGame', async (req, reply) => {
        delete games[req.body.gameId];
    });

    // Route qui recupere les infos du user :username dans la db et les renvoie
    fastify.get('/profile/:username', async (request, reply) => {
        try {
            const username = request.params.username;
            console.log(username);
            // ajouter l'image de profile
            const datas = options.db.prepare('SELECT username, created_at, picture_path FROM users WHERE username = ?').get(username);
            console.log(`Profile fetched from db: `, datas);
            return { success: true, message: `Profile fetched`, datas: datas };
        } catch (error) {
            console.log("error: ", error);
            return { success: false, message: 'Error data db.' };
        }
    });

    // Pareil que au dessus avec les games
    fastify.get('/historic/:username', async (request, reply) => {

        try {
            const username = request.params.username;
            console.log(username);
            const datas = options.db.prepare('SELECT g.game_id, uw.username AS winner_username, ul.username AS loser_username, g.loser_score, g.created_at FROM games g JOIN users uw ON g.winner_id = uw.user_id JOIN users ul ON g.loser_id = ul.user_id WHERE uw.username = ? OR ul.username = ? ORDER BY g.created_at DESC;').all(username,username);

            console.log(`historic fetched from db: `, datas);
            return { success: true, message: `Game fetched`, datas: datas };
        } catch (error) {
            console.error('Error data db.', error);
            return { success: false, message: 'Error data db.' };
        }
    });

    // Route qui modifie la photo de profile ../assets/imgs et change le path dans la db
    fastify.post('/upload/picture/:username', async (request, reply) => {
        const data = await request.parts();
        let uploadedFile;
        const username = params.username;
        for await (const part of data) {
            if (part.file) {
                console.log(username);
                uploadedFile = part;
        
                const filename = username + ".jpg";
        
                const filepath = img_path + filename;
        
                const fileStream = fs.createWriteStream(filepath);
                part.file.pipe(fileStream);
        
                fileStream.on('finish', () => {
                    try {
                        options.db.prepare('UPDATE users SET picture_path = ? WHERE username = ?').run(filename, username);
                    
                        console.log('Picture uploaded in db for: ', username);
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
        console.log(username);
        
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
            const datas = options.db.prepare('SELECT username FROM users WHERE username = ?').get(newusername);
            if (datas != undefined)
                return { success: false, message: 'Username already taken' };
        } catch (error) {
            console.error('Error db.', error);
            return { success: false, message: 'Error db' };
        }
        try {
            options.db.prepare('UPDATE users SET username = ? WHERE username = ?').run(newusername, username);
                
            console.log('Username modified in db for: ', newusername);
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

    fastify.register(async function (fastify) {
        // Gere le matchmaking et la deconnexion en pleine partie (Le deconnecte perd automatiquement)
        // marche en socket
        fastify.get('/matchmaking', { websocket: true }, (socket, req) => {

            if (waiting_list && w_uname != req.query.username) {
                const gameId = createGame(w_uname, req.query.username);
                console.log("game created: ", gameId);
                waiting_list.send(JSON.stringify({ state: "found", gameId: gameId, role: "left", opponent: w_uname }));
                socket.send(JSON.stringify({ state: "found", gameId: gameId, role: "right", opponent: req.query.username }));
    
                socket.on('close', () => {
                    games[gameId].scores["left"] = 11;
                });
                waiting_list.on('close', () => {
                    games[gameId].scores["right"] = 11;
                });
                waiting_list = null;
                w_uname = null;
            } else if (w_uname == req.query.username) {
                waiting_list = null;
                w_uname = null;
                console.log("someone left.");
            } else {
                waiting_list = socket;
                w_uname = req.query.username;
                socket.on('close', () => {
                    console.log("someone left.");
                    waiting_list = null;
                    w_uname = null;
                });
            }
        });
    });

    setInterval(() => {
        Object.values(games).forEach(game => {
            game.ball.x += game.ball.vx;
            game.ball.y += game.ball.vy;

            if (game.ball.y <= 10 || game.ball.y >= 480)
                game.ball.vy *= -1;

            if (game.ball.x < game.paddles.left.x + 10
                && game.ball.y > game.paddles.left.y
                && game.ball.y < game.paddles.left.y + 100) {
                    // ix = game.ball.x
                    // iy = game.ball.y
                    let dist = Math.abs(game.ball.y, game.paddles.left.y)


                    game.ball.vx = Math.abs(game.ball.vx);
                }
            else if (game.ball.x > game.paddles.right.x
                && game.ball.y > game.paddles.right.y
                && game.ball.y < game.paddles.right.y + 100) {
                    let dist = Math.abs(game.ball.y, game.paddles.left.y)
                    game.ball.vx = Math.abs(game.ball.vx) * -1;
                }

            if (game.ball.x <= game.paddles.left.x - 10 || game.ball.x >= game.paddles.right.x + 20) {
                game.scores[game.ball.x <= game.paddles.left.x - 10 ? "right" : "left"]++;
                Object.assign(game.ball, { x: 350, y: 200 });
            }
                    
        });
    }, 30);
}




export default gameRoute;