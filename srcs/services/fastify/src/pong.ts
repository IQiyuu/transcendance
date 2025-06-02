import {ClientSocket} from "./ClientSocket.js";

const paddleWidth = 10, paddleHeight = 100;

// Game for a given client
export class   Game{
    /**
     * Controller
     */
    private game_id : number;
    private side = null;
    public key_state = {};
    private opponent = null;
    private is_local : boolean = false;

    private l_score : number = 0;
    private r_score : number = 0;

    private l_paddle_x : number = 10;
    private l_paddle_y : number = 0;

    private r_paddle_x : number = 680;
    private r_paddle_y : number = 0;

    private ball_x : number = 0;
    private ball_y : number = 0;
    

    /**
     * View
    */
    private canvas = document.getElementById("pong") as HTMLCanvasElement;
    private ctx = this.canvas.getContext("2d");

    private left_player_tag = document.getElementById("player-left");
    private right_player_tag = document.getElementById("player-right");

    private score_left = document.getElementById("score-left");
    private score_right = document.getElementById("score-right");
    private cws : ClientSocket = null;


    constructor(socket, id, side, opponent, is_local){
        console.log("Client game created !");
        this.cws = socket;
        this.side = side;
        this.opponent = opponent;
        this.game_id = id;
        this.is_local = is_local;

        this.init();

        //Launch the animation
        requestAnimationFrame(() => this.draw());
    }

    getSide(){
        return this.side;
    }

    isLocal(){
        return this.is_local;
    }

    key_handler(e){
        this.key_state[e.code] = (e.type === "keydown");
    }

    /** W and S for left player if 2 player, else UP and DOWN */
    moves(obj, cws){
        if (obj.key_state["ArrowUp"] || obj.key_state["ArrowDown"]) {
            cws.update_pos(obj.getGameId(), obj.key_state["ArrowUp"], obj.isLocal() ? "right" : obj.get_side());
        }
        if (obj.isLocal() && (obj.key_state["KeyW"] || obj.key_state["KeyS"])){
            cws.update_pos(obj.getGameId(), obj.key_state["KeyW"], "left");
        }
    }


    init(){
        this.canvas.addEventListener("keyup", this.key_handler);
        this.canvas.addEventListener("keydown", this.key_handler);
        if (this.is_local){
            this.canvas.addEventListener("W",  this.key_handler);
            this.canvas.addEventListener("S",  this.key_handler);
        }
        this.key_state["ArrowUp"] = false;
        this.key_state["ArrowDown"] = false;
        this.key_state["KeyW"] = false;
        this.key_state["KeyS"] = false;

        
        this.l_paddle_y = this.canvas.height / 2 - paddleHeight / 2;
        this.r_paddle_y = this.canvas.height / 2 - paddleHeight / 2;
        
        this.print_player_names();
        
        //testing
        setInterval(this.moves, 10, this, this.cws);
    }

    // Update every game values
    update_state(game){
        this.l_score = game.scores.left;
        this.r_score = game.scores.right;

        this.ball_x = game.ball.x;
        this.ball_y = game.ball.y;

        this.l_paddle_x = game.paddles.left.x;
        this.l_paddle_y = game.paddles.left.y;

        this.r_paddle_x = game.paddles.right.x;
        this.r_paddle_y = game.paddles.right.y;
    }

    // start(){
    //     //say to server we are ready
    //     this.cws.say_ready();
    // }

    /**
     * View part
    */

    // draw the canva with values
    draw(){
        this.score_left.textContent = String(this.l_score);
        this.score_right.textContent = String(this.r_score);

        // paddles
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
//         ctx.fillStyle = "rgb(160, 94, 204)";
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
        //ball
    }

    print_player_names(){
        if (this.side === "left"){
            this.left_player_tag.textContent = this.cws.get_username() || "Player 1";
            this.right_player_tag.textContent = this.opponent || "Player 2";
        }
        else{
            this.left_player_tag.textContent = this.opponent || "Player 1";
            this.right_player_tag.textContent = this.cws.get_username() || "Player 2";
        }
    }
};

// /*----------------------------------------------------------------------------------------*/
// let _userId = sessionStorage.userId;

// const ballRadius = 5;

// let _winningScore = 11; // const ??


// // Rentre la game dans la db
// async function saveGame(game) {
//     console.log("game saved");
//     try {
//         const winner = game.scores.left == 11 ? "left" : "right";
//         const body = { 
//             winner_username: game.players[winner], 
//             loser_username: game.players[(winner == "right" ? "left": "right")],
//             loser_score: game.scores.left == 11 ? game.scores.right : game.scores.left
//         };
//         const response = await fetch("game/storeGame", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(body),
//         });
//         const data = await response.json();
//         console.log("Réponse du serveur :", data);
//     } catch (error) {
//         console.log("error: ", error);
//     }
// }

// // Affiche le canvas
// async function draw(ws, local) {
//     try {
//         const response = await fetch(`/game/${_gameId}`, {
//             method: "GET",
//             headers: { "Content-Type": "application/json" },
//         });

//         if (!response.ok) {
//             console.log("error fetching game data");
//             return;
//         }

//         const game = await response.json();


//         if (game.scores.left == _winningScore || game.scores.right == _winningScore) {
//             const winner = game.scores.left == 11 ? "left" : "right";
//             if (ws && _role == winner)
//                 await saveGame(game);
//             endGame(ws);
//             return ;
//         }


//         // Dimensions du rectangle
//         const rectWidth = 700;
//         const rectHeight = 500;
//         // Calcul pour centrer
//         const x = (canvas.width - rectWidth) / 2;
//         const y = (canvas.height - rectHeight) / 2;

//         ctx.fillStyle = "black";
//         // Paddles
//         ctx.fillRect(
//             x + game.paddles.left.x,
//             y + game.paddles.left.y,
//             paddleWidth,
//             paddleHeight
//         );
//         ctx.fillRect(
//             x + game.paddles.right.x,
//             y + game.paddles.right.y,
//             paddleWidth,
//             paddleHeight
//         );

//         // Balle
//         ctx.beginPath();
//         ctx.arc(x + game.ball.x, y + game.ball.y, ballRadius, 0, Math.PI * 2);

//         ctx.fill();
//         ctx.closePath();


//         // Dessin du rectangle centré
//         ctx.beginPath();
//         ctx.moveTo(x, y);
//         ctx.lineTo(x + rectWidth, y);
//         ctx.lineTo(x + rectWidth, y + rectHeight);
//         ctx.lineTo(x, y + rectHeight);
//         ctx.closePath();

//         ctx.stroke();

//     } catch (error) {
//         console.log("error: ", error);
//     }

//     moves(local);
//     requestAnimationFrame(() => draw(ws, local));
// }


 


// // Lance la partie
// function startGame(oponnent, ws, local) {

//     canvas.tabIndex = 1000;
//     draw(ws, local);
// }

// // Termine la partie
// async function endGame(ws) {
//     try {
//         const body = { 
//             gameId: _gameId, 
//         };
//         await fetch("game/stopGame", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(body),
//         });
//     } catch (error) {
//         console.log("error: ", error);
//     }
//     document.getElementById("menu").classList.replace("hidden", "block");
//     document.getElementById("game_box").classList.replace("flex", "hidden");
//     _gameId = -1;
//     console.log("moves unavaible");
//     if (ws instanceof WebSocket)
//         ws.close();
//     _mod = null;
//     await displayMenu();
// }


// function fillCanvas() {
//     ctx.fillStyle = "rgb(160, 94, 204)";
//     ctx.fillRect(0, 0, canvas.width, canvas.height);
// }

