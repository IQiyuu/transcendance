const canvas = document.getElementById("pong") as HTMLCanvasElement;
const matchmaking_btn = document.getElementById("matchmaking");
const ctx = canvas.getContext("2d");
let _userId = sessionStorage.userId;
let _role = null;
let _state: any = null;
let _local = false;

const paddleWidth = 10, paddleHeight = 100;
const ballRadius = 5;

let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
//let canvasCenterX = canvas.width / 2;
//let canvasCenterY = canvas.height / 2;
//let ballSpeedX = 5;
//let ballSpeedY = 3;


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

function draw(ws, local) {
    if (_gameId === -1) return;
    const game = _state;
    if (game) {
        document.getElementById("player-left").textContent = game.players.left || "Player 1";
        document.getElementById("player-right").textContent = game.players.right || "Player 2";
        document.getElementById("score-left").textContent = game.scores.left;
        document.getElementById("score-right").textContent = game.scores.right;

        if (game.scores.left >= _winningScore || game.scores.right >= _winningScore) {
            const winner = game.scores.left >= _winningScore ? "left" : "right";
            if (ws && _role == winner)
                saveGame(game);
            endGame(ws);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgb(160, 94, 204)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const rectWidth = 700;
        const rectHeight = 500;
        const x = (canvas.width - rectWidth) / 2;
        const y = (canvas.height - rectHeight) / 2;

        ctx.fillStyle = "black";
        ctx.fillRect(x + game.paddles.left.x, y + game.paddles.left.y, paddleWidth, paddleHeight);
        ctx.fillRect(x + game.paddles.right.x, y + game.paddles.right.y, paddleWidth, paddleHeight);

        ctx.beginPath();
        ctx.arc(x + game.ball.x, y + game.ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + rectWidth, y);
        ctx.lineTo(x + rectWidth, y + rectHeight);
        ctx.lineTo(x, y + rectHeight);
        ctx.closePath();
        ctx.stroke();
    }
    requestAnimationFrame(() => draw(ws, local));
}

function keyHandler(e: KeyboardEvent) {
    const down = e.type === "keydown";
    if (!!keyState[e.code] === down) return;   // ignore la répétition automatique
    keyState[e.code] = down;
    sendInput();
}

function sendInput() {
    if (!(_ws instanceof WebSocket) || _ws.readyState !== 1 || _gameId === -1) return;
    if (_local) {
        _ws.send(JSON.stringify({
            type: "localInput", gameId: _gameId,
            left:  { up: !!keyState["KeyW"],    down: !!keyState["KeyS"] },
            right: { up: !!keyState["ArrowUp"], down: !!keyState["ArrowDown"] },
        }));
    } else {
        _ws.send(JSON.stringify({
            type: "input", gameId: _gameId,
            up: !!keyState["ArrowUp"], down: !!keyState["ArrowDown"],
        }));
    }
}

function releaseKeys() {
    for (const k in keyState) keyState[k] = false;
    sendInput();
}

function onState(e: MessageEvent) {
    try {
        const d = JSON.parse(e.data);
        if (d.type === "state" && d.gameId == _gameId) _state = d;
    } catch {}
}

// Lance la partie
function startGame(oponnent, ws, local) {
    canvas.addEventListener("keydown",  keyHandler);
    canvas.addEventListener("keyup",  keyHandler);
    canvas.addEventListener("S",  keyHandler);
    canvas.addEventListener("W",  keyHandler);
    keyState["KeyW"] = false;
    keyState["KeyS"] = false;
    keyState["ArrowUp"] = false;
    keyState["ArrowDown"] = false;
    document.getElementById("menu").classList.replace("block", "hidden");
    document.getElementById("game_box").classList.replace("hidden", "flex");
    canvas.tabIndex = 0;
    canvas.focus();
    // console.log("moves available, playing against: ", oponnent);
    // console.log(local);
    _local = local;
    _state = null;
    ws.addEventListener("message", onState);
    canvas.addEventListener("blur", releaseKeys);
    sendInput();   // ← enregistre la socket côté serveur, même sans touche appuyée
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
    document.getElementById("menu").classList.replace("hidden", "block");
    document.getElementById("game_box").classList.replace("flex", "hidden");
    if (ws instanceof WebSocket) ws.removeEventListener("message", onState);
        _state = null;
    _gameId = -1;
    console.log("moves unavaible");
    if (ws instanceof WebSocket)
        ws.close();
    _mod = null;
    await displayMenu();
}


let count = 0;
let interval;
// Animation du boutton
function startMatchmakingAnimation() {
    count = 0;
    interval = setInterval(() => {
        count++;
        matchmaking_btn.textContent = lang_file['waiting'] + '.'.repeat(count % 3);
    }, 500);
}
  
function stopMatchmakingAnimation() {
    clearInterval(interval);
    matchmaking_btn.textContent = lang_file['play_online'];
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

