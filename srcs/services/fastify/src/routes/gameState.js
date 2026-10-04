// routes/gameState.js
export const STARTING_SPEED = 5;
export const ACCELERATION = 1;
export const LIMIT_SPEED = 15;
export const STARTING_X = 400;
export const STARTING_Y = 200;

export const games = {};
let nextId = 0;   // un id qui ne se réutilise jamais

export function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function degToRad(degree) {
    return (degree * Math.PI) / 180;
}

export function createGame(l_name, r_name) {
    const gameId = nextId++;
    const angle = degToRad(randomIntFromInterval(0, 45));
    const neg_x = randomIntFromInterval(0, 1), neg_y = randomIntFromInterval(0, 1);
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
                y: 300
            },
            right: {
                x: 680,
                y: 300
            }
        }
    }
    return gameId;
}

export const gameSockets = new Map();

export function broadcastState(game) {
    const s = gameSockets.get(game.id);
    if (!s) return;
    // payload construit à la main : jamais l'objet game entier (fonctions, sockets)
    const msg = JSON.stringify({
        type: 'state',
        gameId: game.id,
        players: game.players,
        scores: game.scores,
        ball: { x: game.ball.x, y: game.ball.y },
        paddles: game.paddles,
    });
    for (const sock of new Set([s.left, s.right]))
        if (sock && sock.readyState === 1) sock.send(msg);
}