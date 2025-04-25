var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var canvas = document.getElementById("pong");
var matchmaking_btn = document.getElementById("matchmaking");
var ctx = canvas.getContext("2d");
var _userId = sessionStorage.userId;
var _role = null;
var paddleWidth = 10, paddleHeight = 100;
var ballRadius = 5;
var leftPaddleY = canvas.height / 2 - paddleHeight / 2;
var rightPaddleY = canvas.height / 2 - paddleHeight / 2;
var ballX = canvas.width / 2;
var ballY = canvas.height / 2;
var ballSpeedX = 5;
var ballSpeedY = 3;
var leftScore = 0;
var rightScore = 0;
var leftUsername = null;
var rightUsername = null;
var _winningScore = 11;
var _gameId = 0;
var keyState = {};
var ws = null;
// Rentre la game dans la db
function saveGame(game) {
    return __awaiter(this, void 0, void 0, function () {
        var winner, body, response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("game saved");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    winner = game.scores.left == 11 ? "left" : "right";
                    body = {
                        winner_username: game.players[winner],
                        loser_username: game.players[(winner == "right" ? "left" : "right")],
                        loser_score: game.scores.left == 11 ? game.scores.right : game.scores.left
                    };
                    return [4 /*yield*/, fetch("storeGame", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    console.log("Réponse du serveur :", data);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.log("error: ", error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Affiche le canvas
function draw(ws) {
    return __awaiter(this, void 0, void 0, function () {
        var response, game, winner, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, fetch("/game/".concat(_gameId), {
                            method: "GET",
                            headers: { "Content-Type": "application/json" },
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        console.log("error fetching game data");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    game = _a.sent();
                    document.getElementById("player-left").textContent = game.players.left || "Player 1";
                    document.getElementById("player-right").textContent = game.players.right || "Player 2";
                    document.getElementById("score-left").textContent = game.scores.left;
                    document.getElementById("score-right").textContent = game.scores.right;
                    if (!(game.scores.left == _winningScore || game.scores.right == _winningScore)) return [3 /*break*/, 5];
                    winner = game.scores.left == 11 ? "left" : "right";
                    if (!(_role == winner)) return [3 /*break*/, 4];
                    return [4 /*yield*/, saveGame(game)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    endGame(ws);
                    return [2 /*return*/];
                case 5:
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
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    console.log("error: ", error_2);
                    return [3 /*break*/, 7];
                case 7:
                    moves();
                    requestAnimationFrame(draw);
                    return [2 /*return*/];
            }
        });
    });
}
// Recupere les touches enfoncees
function keyHandler(e) {
    keyState[e.code] = (e.type === "keydown");
}
// Fait une requete qui va bouger les paddles (raquettes)
function moves() {
    return __awaiter(this, void 0, void 0, function () {
        var body, response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(keyState["ArrowUp"] || keyState["ArrowDown"])) return [3 /*break*/, 4];
                    body = {
                        gameId: _gameId,
                        role: _role,
                        moveUp: keyState["ArrowUp"],
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("/game/".concat(_gameId, "/move"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        console.log("error in movement request");
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.log("error: ", error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
;
// Lance la partie
function startGame(oponnent, ws) {
    document.addEventListener("keydown", keyHandler);
    document.addEventListener("keyup", keyHandler);
    document.getElementById("scoreboard").style.display = "flex";
    document.getElementById("menu").style.display = "none";
    canvas.tabIndex = 1000;
    canvas.style.outline = "none";
    console.log("moves avaible, playing against: ", oponnent);
    draw(ws);
}
// Termine la partie
function endGame(ws) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    canvas.removeEventListener("keydown", moves);
                    document.getElementById("scoreboard").style.display = "none";
                    document.getElementById("menu").style.display = "flex";
                    _gameId = 0;
                    console.log("moves unavaible");
                    if (ws instanceof WebSocket)
                        ws.close();
                    ws = null;
                    return [4 /*yield*/, displayMenu()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var count = 0;
var interval;
var matchmakingText = ['Waiting an opponent', 'Waiting an opponent.', 'Waiting an opponent..', 'Waiting an opponent...'];
// Animation du boutton
function startMatchmakingAnimation() {
    count = 0;
    interval = setInterval(function () {
        count++;
        matchmaking_btn.textContent = matchmakingText[count % matchmakingText.length];
    }, 500);
}
function stopMatchmakingAnimation() {
    clearInterval(interval);
    matchmaking_btn.textContent = 'Play online';
}
// Se connecte en socket avec le serveur et attend un autre utilisateur.
function matchmaking(event) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!ws)
                ws = new WebSocket("wss://".concat(window.location.host, "/matchmaking?username=").concat(_username));
            else {
                console.log("queue stopped.");
                stopMatchmakingAnimation();
                ws.close();
                ws = null;
                return [2 /*return*/];
            }
            ws.onopen = function (event) {
                console.log("searching for a match. . .");
                startMatchmakingAnimation();
            };
            ws.onmessage = function (event) {
                var data = JSON.parse(event.data);
                stopMatchmakingAnimation();
                if (data.state == "found") {
                    console.log("Match trouvé :", data);
                    _role = data.role;
                    _gameId = data.gameId;
                    console.log("game starting ", _gameId);
                    startGame(data.opponent, ws);
                }
            };
            return [2 /*return*/];
        });
    });
}
matchmaking_btn.addEventListener("click", matchmaking);
function fillCanvas() {
    ctx.fillStyle = "rgb(160, 94, 204)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
