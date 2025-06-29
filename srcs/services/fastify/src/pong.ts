import {GameClientSocket} from "./GameClientSocket.js";
import { SiteController } from "./SiteController.js";

const PADDLE_W = 10, PADDLE_H = 80;

// Game for a given client
export class   GameController{
    /**
     * Controller
     */
    private ws : GameClientSocket = null;
    private site : SiteController = null;

    private is_searching : boolean = false;
	private	is_tournament : boolean = false;

    private username : string = "undefined";

    // Game
    private game_id : number = -1;
    private side = "left";
    public key_state = {};
    private is_local : boolean = false;
    
    private left_player : string = null;
    private right_player : string = null;

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
    private game_page = document.getElementById("game_page");

    private online_play_btn = document.getElementById("matchmaking");
    private offline_play_btn = document.getElementById("offline");

    private game = document.getElementById("game");

    private left_player_tag = document.getElementById("player-left");
    private right_player_tag = document.getElementById("player-right");

    private score_left = document.getElementById("score-left");
    private score_right = document.getElementById("score-right");

    private ball = document.getElementById("ball");
    private l_paddle = document.getElementById("l_paddle");
    private r_paddle = document.getElementById("r_paddle");

    //      Interval for animations
    private interval_id;


    constructor(site){
        this.site = site;
    }

    setUsername(username){
        this.username = username;
    }

    getSide(){
        return this.side;
    }

    setSide(new_side){
        this.side = new_side;
    }

    getGameId(){
        return (this.game_id);
    }

    isLocal(){
        return this.is_local;
    }

    key_handler(e){
        //for accessibility, here too
        e.preventDefault();
        if ("KeyW,KeyS,ArrowUp,ArrowDown".includes(e.code))
            this.key_state[e.code] = (e.type === "keydown");
    }


    /**
     * Controller
     */

    addEvents(){
        //Online playing
        this.online_play_btn.addEventListener("click", async (event) => {
            event.preventDefault();

            if (this.is_searching){
                this.stopMatchmaking();
            } else{
                this.startMatchmaking();
            }
            this.is_searching = !this.is_searching;
        });

        //Local play
    this.offline_play_btn.addEventListener("click", (event) => {
    event.preventDefault();

    const modal = document.getElementById("offline-confirm-modal");
    const yesBtn = document.getElementById("modal-confirm-yes");
    const noBtn = document.getElementById("modal-confirm-no");

    modal.classList.remove("hidden");

    const closeModal = () => {
        modal.classList.add("hidden");
        yesBtn.removeEventListener("click", onYes);
        noBtn.removeEventListener("click", onNo);
    };

    const onYes = () => {
        closeModal();
        this.stopMatchmaking();
        this.print_play_page();
        this.is_local = true;
        this.ws = new GameClientSocket(this.username, this);
        this.ws.startOfflineGame();
    };

    const onNo = () => {
        closeModal();
    };

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
});
    }

    /**
     * Model
     */

    /**
     *  Handler function that tell the server when user move
     * (W and S for left player if 2 player, else UP and DOWN)
     *  */
    moves(obj, ws){
        // console.log("Moves");
        obj.draw();
        if (obj.key_state["ArrowUp"] || obj.key_state["ArrowDown"]) {
            ws.updatePos(obj.getGameId(), obj.key_state["ArrowUp"], obj.isLocal() ? "right" : obj.getSide());
        }
        if (obj.isLocal() && (obj.key_state["KeyW"] || obj.key_state["KeyS"])){
            ws.updatePos(obj.getGameId(), obj.key_state["KeyW"], "left");
        }
    }


    startMatchmaking(){
        this.start_matchmaking_animation();
        this.is_local = false;
        if (this.ws !== null && this.ws !== undefined){
            console.error("You cant start a matchmaking while having a match");
            return ;
        }
        this.ws = new GameClientSocket(this.username, this);
        this.ws.startMatchmaking();
        console.log("Matchmaking started");
    }

    stopMatchmaking(){
        this.stop_matchmaking_animation();
        if (this.ws !== null){
            this.ws.stopMatchmaking();
            this.ws.close();
            this.ws = null;
            console.log("Socket closed for pong");
        }
    }

    startTournamentGame(game_id, game){
        this.ws = new GameClientSocket(this.username, this, game_id);
		this.is_tournament = true;
        if (this.username === game.players.right)
            this.side = "right";
        this.site.hide_all();
        this.print_game();
        this.print_play_page();
        this.updateState(game);
        this.gameInit();
    }

    close(){
        this.stop_matchmaking_animation();
        if (this.ws !== null){
            this.ws.close();
            this.ws = null;
        }
		// is_tournament ?
    }

    gameInit(){
        this.key_state["ArrowUp"] = false;
        this.key_state["ArrowDown"] = false;
        this.key_state["KeyW"] = false;
        this.key_state["KeyS"] = false;

        this.key_handler = this.key_handler.bind(this); //to unbind ??
        document.addEventListener("keyup", this.key_handler);
        document.addEventListener("keydown", this.key_handler);

        this.print_player_names();

        this.ball.style.position="relative";
        this.l_paddle.style.position="relative";
        this.r_paddle.style.position="relative";

        //testing maybe not here
        this.interval_id = setInterval(this.moves, 10, this, this.ws);
    }

    async registerGame() {
        try {
            console.log("REGISTER1");
            const winner = this.score_left < this.score_right ? this.right_player : this.left_player;
            const loser = winner == this.left_player ? this.right_player : this.left_player;
            const loser_score = this.score_left > this.score_right ? this.score_right.textContent : this.score_left.textContent;
            console.log(this.right_player, " ", this.left_player, " ", winner, " ", loser, " ", loser_score);
            const body = {
                winner_username: winner,
                loser_username: loser,
                loser_score: loser_score, // if tournament, 
            }
            console.log("REGISTER2");
            const req = await fetch('/game/storeGame', {
                method: 'POST',
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            console.log("REGISTER3");
            const data = await req.json();
            console.log("REGISTER4");
            if (!data.success)
                throw (Error(data.error));
            console.log("REGISTER5");
        } catch (error){
            alert(error);
        }
    }

    finishGame(){
        document.removeEventListener("keyup", this.key_handler)
        document.removeEventListener("keydown", this.key_handler)
        clearInterval(this.interval_id);
        this.hide_game();
        this.print_end_game();

        if (!this.is_local && this.side === "left") // then if right user 
            this.registerGame();
    }

    /**
     * VIEW
     */
    start_matchmaking_animation(){
        let count = 0;

        document.getElementById("matchmaking").innerHTML = "<span id='waiting_online'>waiting</span>"
            + "<span id='dots'></span>"
            + "<br><span id='cancel_game'>click to cancel ❌</span>";
        // good luck ! (need to have dynamcly inserted dialogue)
        // maybe by getting current value then adding in the handler ?
        this.interval_id = window.setInterval(() => {
            count++;
            document.getElementById("dots").innerHTML = '.'.repeat(count % 3) + "<br>";
            //document.getElementById("matchmaking").textContent = "\nclick to cancel";
        }, 500);
        this.site.loadLang();
        // this.interval_id = setInterval(() => {
        //     btn.textContent = waiting + '.'.repeat(count % 3);
        // }, 500);
    }

    stop_matchmaking_animation(){
        document.getElementById("matchmaking").innerHTML = "";
        this.site.loadLang();
        clearInterval(this.interval_id);
        this.online_play_btn.textContent = this.site.getText('play_online');
    }

    // Update every game values
    updateState(game){
        // console.log("Updating game");
        // console.log(game);

        this.game_id = game.id;

        this.l_score = game.scores.left;
        this.r_score = game.scores.right;

        this.ball_x = game.ball.x;
        this.ball_y = game.ball.y;

        this.l_paddle_x = game.paddles.left.x;
        this.l_paddle_y = game.paddles.left.y;

        this.r_paddle_x = game.paddles.right.x;
        this.r_paddle_y = game.paddles.right.y;

        this.left_player = game.players.left;
        this.right_player = game.players.right;
    }

    // start(){
    //     //say to server we are ready
    //     this.ws.say_ready();
    // }

    /**
     * View part
    */

    cooToPos_x(x){
        return x;
    }

    cooToPos_y(y){
        return y;
    }

    // Move both paddles
    draw_paddles(){
        // Distance
        this.l_paddle.style.left = this.cooToPos_x(this.l_paddle_x).toString() + "px";
        this.l_paddle.style.top = this.cooToPos_y(this.l_paddle_y).toString() + "px";

        this.r_paddle.style.left = this.cooToPos_x(this.r_paddle_x).toString() + "px";
        this.r_paddle.style.top = this.cooToPos_y(this.r_paddle_y).toString() + "px";
    }

    // Move ball
    draw_ball(){
        // console.log("Drawing ball");
        // console.log("Ball : " + this.ball_x + this.ball_y);
        this.ball.style.left = this.cooToPos_x(this.ball_x).toString() + "px";
        this.ball.style.top = this.cooToPos_y(this.ball_y).toString() + "px";
    }

    draw_scores(){
        this.score_left.innerText = this.l_score.toString();
        this.score_right.innerText = this.r_score.toString();
    }

    // draw the canva with values
    draw(){
        // console.log("Drawing");
        this.draw_paddles();
        this.draw_ball();
        this.draw_scores();
    }

    print_player_names(){
        this.left_player_tag.innerText = this.left_player;
        this.right_player_tag.innerText = this.right_player;
    }

    print_play_page(){
        this.game_page.classList.replace("hidden", "flex");
    }

    hide_play_page(){
        this.game_page.classList.replace("flex", "hidden");
    }

    print_scoreboard(){
        this.game.classList.replace("hidden", "flex");
    }

    hide_scoreboard(){
        this.game.classList.replace("flex", "hidden");
    }

    print_game(){
        this.game.classList.replace("hidden", "flex");
    }

    hide_game(){
        this.game.classList.replace("flex", "hidden");
    }

    print_end_game(){
        alert("To do, but game finished");
    }

    hide_end_game(){
        console.log("Maybe clearing the text ?");
    }

    // Not to be added to hide_all
    hide_menu(){
        this.site.hide_menu();
    }

    hide_all(){
        this.hide_play_page();
        this.hide_game();
        this.hide_scoreboard();
    }
 
    //bad design, because we should separate view from ctl
    hide_aal(){
        this.site.hide_all();
    }
};

