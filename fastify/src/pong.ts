const canvas = document.getElementById("pong") as HTMLCanvasElement;
const matchmaking_btn = document.getElementById("matchmaking");
const ctx = canvas.getContext("2d");
let _userId = sessionStorage.userId;
let _role = null;

const paddleWidth = 10, paddleHeight = 100;
const ballRadius = 5;

let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 5;
let ballSpeedY = 3;

let leftScore = 0;
let rightScore = 0;
let leftUsername = null;
let rightUsername = null;

let _winningScore = 11;

let _gameId = 0;

var keyState = {};

let ws = null;

async function saveGame(game) {
    try {
        const winner = game.scores.left == 11 ? "left" : "right";
        console.log(game.players[winner], " won.");
        const body = { 
            winner_username: game.players[winner], 
            loser_username: game.players[winner == "right" ? winner : "left"],
            loser_score: game.scores.left == 11 ? game.scores.right : game.scores.left
        };
        const response = await fetch("storeGame", {
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

async function draw(ws) {
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

        document.getElementById("player-left").textContent = game.players.left || "Player 1";
        document.getElementById("player-right").textContent = game.players.right || "Player 2";
        document.getElementById("score-left").textContent = game.scores.left;
        document.getElementById("score-right").textContent = game.scores.right;

        if (game.scores.left == _winningScore || game.scores.right == _winningScore) {
            const winner = game.scores.left == 11 ? "left" : "right";
            if (_role == winner)
                await saveGame(game);
            endGame(ws);
            return ;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgb(160, 94, 204)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "black";
        ctx.fillRect(10, game.paddles.left.y - paddleHeight / 2, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - paddleWidth - 10, game.paddles.right.y - paddleHeight / 2, paddleWidth, paddleHeight);

        ctx.beginPath();
        ctx.arc(game.ball.x, game.ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

    } catch (error) {
        console.log("error: ", error);
    }

    moves();
    requestAnimationFrame(draw);
}

function keyHandler(e){
    keyState[e.code] = (e.type === "keydown");
 }
 

async function moves() {
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
};

function startGame(oponnent, ws) {
    document.addEventListener("keydown",  keyHandler);
    document.addEventListener("keyup",  keyHandler);
    canvas.tabIndex = 1000;
    canvas.style.outline = "none";
    console.log("moves avaible, playing against: ", oponnent);
    draw(ws);
}

async function endGame(ws) {
    canvas.removeEventListener("keydown", moves);
    _gameId = 0;
    console.log("moves unavaible");
    ws = null;
    ws.close();
    await displayMenu();
}


let count = 0;
let interval;
const matchmakingText = ['Waiting an opponent', 'Waiting an opponent.', 'Waiting an opponent..', 'Waiting an opponent...'];
function startMatchmakingAnimation() {
    count = 0;
    interval = setInterval(() => {
        count++;
        matchmaking_btn.textContent = matchmakingText[count % matchmakingText.length];
    }, 500);
  }
  
  function stopMatchmakingAnimation() {
    clearInterval(interval);
    matchmaking_btn.textContent = 'Play';
  }

async function matchmaking(event) {
    if (!ws)
        ws = new WebSocket(`wss://${window.location.host}/matchmaking?username=${_username}`);
    else {
        console.log("queue stopped.");
        stopMatchmakingAnimation();
        ws.close();
        ws = null;
        return ;
    }
    ws.onopen = (event) => {
        console.log("searching for a match. . .");
        startMatchmakingAnimation();
    }
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        stopMatchmakingAnimation();
        if (data.state == "found") {
            console.log("Match trouvé :", data);
            _role = data.role;
            _gameId = data.gameId;
            console.log("game starting ", _gameId);
            startGame(data.opponent, ws);
        }
    };
}
matchmaking_btn.addEventListener("click", matchmaking);

function fillCanvas() {
    ctx.fillStyle = "rgb(160, 94, 204)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

