const canvas = document.getElementById("pong") as HTMLCanvasElement;
const matchmaking_btn = document.getElementById("matchmaking");
const ctx = canvas.getContext("2d");
let _userId = sessionStorage.userId;
let _role = null;

const paddleWidth = 10, paddleHeight = 100;
const ballRadius = 5;

let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
// let ballX = canvas.width / 2;
// let ballY = canvas.height / 2;
// let ballSpeedX = 5;
// let ballSpeedY = 3;

let leftScore = 0;
let rightScore = 0;
let leftUsername = null;
let rightUsername = null;

let _winningScore = 11;

let _gameId = -1;

var keyState = {};

let _mod = null;

// Rentre la game dans la db
async function saveGame(game) {
    console.log("game saved");
    try {
        const winner = game.scores.left == 11 ? "left" : "right";
        const body = { 
            winner_username: game.players[winner], 
            loser_username: game.players[(winner == "right" ? "left": "right")],
            loser_score: game.scores.left == 11 ? game.scores.right : game.scores.left
        };
        const response = await fetch("game/storeGame", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        console.log("Réponse du serveur :", data);
    } catch (error) {
        console.log("error: ", error);
    }
}

// Affiche le canvas
async function draw(ws, local) {
    try {
        const response = await fetch(`/game/${_gameId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            console.log("error fetching game data");
            return;
        }

        const game = await response.json();

        console.log("Ball vec: " + game.ball.dx + " " + game.ball.dy);
        document.getElementById("player-left").textContent = game.players.left || "Player 1";
        document.getElementById("player-right").textContent = game.players.right || "Player 2";
        document.getElementById("score-left").textContent = game.scores.left;
        document.getElementById("score-right").textContent = game.scores.right;

        if (game.scores.left == _winningScore || game.scores.right == _winningScore) {
            const winner = game.scores.left == 11 ? "left" : "right";
            if (ws && _role == winner)
                await saveGame(game);
            endGame(ws);
            return ;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgb(160, 94, 204)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "black";
        ctx.fillRect(game.paddles.left.x - paddleWidth, game.paddles.left.y - paddleHeight / 2, paddleWidth, paddleHeight);
        ctx.fillRect(game.paddles.right.x - paddleWidth, game.paddles.right.y - paddleHeight / 2, paddleWidth, paddleHeight);

        ctx.beginPath();
        ctx.arc(game.ball.x, game.ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        
        ctx.beginPath();
        ctx.moveTo(100, 100);
        ctx.lineTo(800, 100);
        ctx.lineTo(800, 600);
        ctx.lineTo(100, 600);
        ctx.lineTo(100, 100);
        ctx.stroke();

    } catch (error) {
        console.log("error: ", error);
    }

    moves(local);
    requestAnimationFrame(() => draw(ws, local));
}

// Recupere les touches enfoncees
function keyHandler(e){
    keyState[e.code] = (e.type === "keydown");
}
 

// Fait une requete qui va bouger les paddles (raquettes)
async function moves(local) {
    if (!local) {
        if (keyState["ArrowUp"] || keyState["ArrowDown"]) {
            const body = { 
                gameId: _gameId, 
                role: _role,
                moveUp: keyState["ArrowUp"],
            };
            try {
                const response = await fetch(`/game/${_gameId}/move`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                if (!response.ok)
                    console.log("error in movement request");
            } catch (error) {
                console.log("error: ", error);
            }
        }
    }
    else {
        // console.log(keyState);
        if (keyState["KeyW"] || keyState["KeyS"] || keyState["ArrowUp"] || keyState["ArrowDown"]) {
            const body = { 
                gameId: _gameId, 
                moveRight: (keyState["ArrowUp"] || keyState["ArrowDown"]) ? keyState["ArrowUp"] : null,
                moveLeft: (keyState["KeyW"] || keyState["KeyS"]) ? keyState["KeyW"] : null,
            };
            try {
                const response = await fetch(`/game/local/${_gameId}/move`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                if (!response.ok)
                    console.log("error in movement request");
            } catch (error) {
                console.log("error: ", error);
            }
        }
    }
};

// Lance la partie
function startGame(oponnent, ws, local) {
    document.addEventListener("keydown",  keyHandler);
    document.addEventListener("keyup",  keyHandler);
    document.addEventListener("S",  keyHandler);
    document.addEventListener("W",  keyHandler);
    keyState["KeyW"] = false;
    keyState["KeyS"] = false;
    keyState["ArrowUp"] = false;
    keyState["ArrowDown"] = false;
    document.getElementById("scoreboard").style.display = "flex"
    document.getElementById("menu").style.display = "none"
    canvas.style.display = "flex";
    canvas.tabIndex = 1000;
    canvas.style.outline = "none";
    console.log("moves available, playing against: ", oponnent);
    console.log(local);
    draw(ws, local);
}

// Termine la partie
async function endGame(ws) {
    try {
        const body = { 
            gameId: _gameId, 
        };
        await fetch("game/stopGame", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (error) {
        console.log("error: ", error);
    }
    canvas.removeEventListener("keydown", moves);
    document.getElementById("scoreboard").style.display = "none";
    document.getElementById("menu").style.display = "flex";
    canvas.style.display = "none";
    _gameId = -1;
    console.log("moves unavaible");
    if (ws instanceof WebSocket)
        ws.close();
    _mod = null;
    await displayMenu();
}


let count = 0;
let interval;
const matchmakingText = ['Waiting an opponent', 'Waiting an opponent.', 'Waiting an opponent..', 'Waiting an opponent...'];
// Animation du boutton
function startMatchmakingAnimation() {
    count = 0;
    interval = setInterval(() => {
        count++;
        matchmaking_btn.textContent = matchmakingText[count % matchmakingText.length];
    }, 500);
}
  
function stopMatchmakingAnimation() {
    clearInterval(interval);
    matchmaking_btn.textContent = 'Play online';
}

let searching = false;

// Se connecte en socket avec le serveur et attend un autre utilisateur.
async function matchmaking(event) {
    if (!searching) {
        startMatchmakingAnimation();
        searching = true;
        _ws.send(JSON.stringify({
            type: "matchmaking",
            uname: _username,
            state: "enter"
        }));
    }
    else {
        searching = false;
        console.log("queue stopped.");
        stopMatchmakingAnimation();
        _ws.send(JSON.stringify({
            type: "matchmaking",
            state: "left"
        }));
    }
}
matchmaking_btn.addEventListener("click", matchmaking);

function fillCanvas() {
    ctx.fillStyle = "rgb(160, 94, 204)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

