import {GameClientSocket} from "./GameClientSocket.js";
import { SiteController } from "./SiteController.js";

const PADDLE_W = 10, PADDLE_H = 80;
const BALL_W = 10;

let game_interval_id;
let anim_interval_id;

const key_state = {};

function key_handler(e){
    //for accessibility, here too
    e.preventDefault();
    if ("KeyW,KeyS,ArrowUp,ArrowDown".includes(e.code))
        key_state[e.code] = (e.type === "keydown");
}

// Game for a given client
export class   GameController{
    
    // Controller
    private ws : GameClientSocket = null;
    private site : SiteController = null;

    private is_searching : boolean = false;
	private	is_tournament : boolean = false;

    private username : string = "undefined";

    // Game
    private game_id : number = -1;
    private side : string = "left";
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

    // View
    private game_page = document.getElementById("game_page");

    private online_play_btn = document.getElementById("matchmaking");
    private offline_play_btn = document.getElementById("offline");

    private game = document.getElementById("game");
    private scoreboard = document.getElementById("scoreboard");

    private left_player_tag = document.getElementById("player-left");
    private right_player_tag = document.getElementById("player-right");

    private score_left = document.getElementById("score-left");
    private score_right = document.getElementById("score-right");

    private ball = document.getElementById("ball");
    private l_paddle = document.getElementById("l_paddle");
    private r_paddle = document.getElementById("r_paddle");

    private end_screen = null;

    constructor(site){
        this.site = site;
    }

    setUsername(username : string){
        this.username = username;
    }

    getUsername(){
        return (this.username);
    }

    getSide(){
        return this.side;
    }

    setSide(new_side : string){
        this.side = new_side;
    }

    getGameId(){
        return (this.game_id);
    }

    isLocal(){
        return (this.is_local);
    }


    /**
     * Controller
     */

    addEvents(){
        //Online playing
        this.online_play_btn.addEventListener("click", (event) => {
            event.preventDefault();

            if (this.ws !== null && !this.is_searching){
                alert("ALready in a game");
                return ;
            }

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

            if (this.ws !== null){
                alert("ALready in a game");
                return ;
            }

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

    startMatchmaking(){
        this.start_matchmaking_animation();
        this.is_local = false;
        if (this.ws !== null){ // maybe deprecated
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
            console.log("Matchmaking left");
        }
    }

    startTournamentGame(game_id, game){
		this.is_tournament = true;
        console.log("Creating a tournament game :");
        if (this.ws === null)
            this.ws = new GameClientSocket(this.username, this, game_id);
        else{
            console.log("Game received , lets continue the tournament");
            console.log(game);
            this.ws.setGameId(game_id);
            this.ws.startTournamentGame();
        }
        if (this.username === game.players.right)
            this.side = "right";
        this.updateState(game);
        this.gameInit();
    }

    close(){
        this.stop_matchmaking_animation();
        if (this.ws !== null){
            this.ws.close();
            this.ws = null;
        }
        this.game_id = -1;
        this.is_local = false;
        this.is_searching = false;
        this.is_tournament = false;
    }

    gameInit(){
        key_state["ArrowUp"] = false;
        key_state["ArrowDown"] = false;
        key_state["KeyW"] = false;
        key_state["KeyS"] = false;

        // this.key_handler = this.key_handler.bind(this); //to unbind ??
        document.addEventListener("keyup", key_handler);
        document.addEventListener("keydown", key_handler);

        // if (this.username === game.players.right)
        //     this.side = "right";

        this.print_player_names();
        this.print_scoreboard();
        this.print_game();
        this.print_play_page();

        this.ball.style.position="absolute";
        this.l_paddle.style.position="absolute";
        this.r_paddle.style.position="absolute";

        game_interval_id = setInterval(this.moves, 10, this, this.ws);
    }

    finishGame(){
        clearInterval(game_interval_id);
        document.removeEventListener("keyup", key_handler);
        document.removeEventListener("keydown", key_handler);

        this.hide_scoreboard()
        this.hide_game();
        
        if (this.is_tournament){
            console.log("Tournament's game is finished ending");
            console.log("Not closing socket for it can be used later");
            
            this.game_id = -1;
        } else {
            this.print_end_game();
            console.log("closing socket after game ended");
            this.close();
        }
    }

    // Update every game values
    updateState(game){
        this.game_id = game.id;

        this.l_score = game.scores.left;
        this.r_score = game.scores.right;

        this.ball_x = game.ball.x;
        this.ball_y = game.ball.y;

        this.l_paddle_x = game.paddles.left.x;
        this.l_paddle_y = game.paddles.left.y;

        this.r_paddle_x = game.paddles.right.x;
        this.r_paddle_y = game.paddles.right.y;

        this.left_player = game.players.left; // should be removed
        this.right_player = game.players.right; // should be removed
    }

    /**
     *  Handler function that tell the server when user move
     * (W and S for left player if 2 player, else UP and DOWN)
     *  */
    moves(obj : GameController, ws : GameClientSocket){
        obj.draw();
        if (key_state["ArrowUp"] || key_state["ArrowDown"]) {
            ws.updatePos(obj.getGameId(), key_state["ArrowUp"], obj.isLocal() ? "right" : obj.getSide());
        }
        if (obj.isLocal() && (key_state["KeyW"] || key_state["KeyS"])){
            ws.updatePos(obj.getGameId(), key_state["KeyW"], "left");
        }
    }

    /**
     * VIEW
     */
    start_matchmaking_animation(){
        let count = 0;

        document.getElementById("matchmaking").innerHTML = "<span id='waiting_online'>waiting</span>"
            + "<span id='dots'></span>"
            + "<br><span id='cancel_game'>click to cancel ❌</span>";
        anim_interval_id = window.setInterval(() => {
            count++;
            document.getElementById("dots").innerHTML = '.'.repeat(count % 3) + "<br>";
            //document.getElementById("matchmaking").textContent = "\nclick to cancel";
        }, 500);
        this.site.loadLang();

    }

    stop_matchmaking_animation(){
        document.getElementById("matchmaking").innerHTML = "";
        this.site.loadLang(); // ?
        clearInterval(anim_interval_id);
        this.online_play_btn.textContent = this.site.getText('play_online');
    }

    cooToPos_x(x, type){
        if (type === "paddle")
            return x - (PADDLE_W / 2);
        else if (type === "ball")
            return x - (BALL_W / 2);
    }

    cooToPos_y(y, type){
        if (type === "paddle")
            return y - (PADDLE_H / 2);
        else if (type === "ball")
            return y - (BALL_W / 2);
    }

    // Move both paddles
    draw_paddles(){
        this.l_paddle.style.left = this.cooToPos_x(this.l_paddle_x, "paddle").toString() + "px";
        this.l_paddle.style.top = this.cooToPos_y(this.l_paddle_y, "paddle").toString() + "px";

        this.r_paddle.style.left = this.cooToPos_x(this.r_paddle_x, "paddle").toString() + "px";
        this.r_paddle.style.top = this.cooToPos_y(this.r_paddle_y, "paddle").toString() + "px";
    }

    // Move ball
    draw_ball(){
        this.ball.style.left = this.cooToPos_x(this.ball_x, "ball").toString() + "px";
        this.ball.style.top = this.cooToPos_y(this.ball_y, "ball").toString() + "px";
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
        this.scoreboard.classList.replace("hidden", "flex");
    }

    hide_scoreboard(){
        this.scoreboard.classList.replace("flex", "hidden");
    }

    print_game(){
        this.game.classList.replace("hidden", "flex");
    }

    hide_game(){
        this.game.classList.replace("flex", "hidden");
    }

    print_match_end(){
        console.log("MATCH END");
    }

    async print_end_game() {
        this.hide_scoreboard();
        this.hide_game();

        // Delete si exite
        if (this.end_screen) {
            this.end_screen.remove();
            this.end_screen = null;
        }

        // Creer le bloc
        this.end_screen = document.createElement("div");
        this.end_screen.id = "end_screen";
        this.end_screen.className = `
            fixed top-1/3 left-1/3 right-1/3 bottom-1/3 w-1/4 h-[500px] 
            bg-black bg-opacity-60 text-white 
            flex flex-col justify-center items-center 
            z-50 font-sans text-center p-5 box-border
        `;

        // Le title
        const title = document.createElement("h1");
        title.innerText = "Game Over";
        title.className = "mb-5 text-4xl";
        this.end_screen.appendChild(title);

        let leftPic = null;
        let rightPic = null;

        try {
            // Recup les pp
            const res = await fetch(`/db/select/pics/${this.left_player}/${this.right_player}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();

                console.log(data);

                const pics = data.datas;

                for (const pic of pics) {
                    console.log(pic);
                    if (pic.username === this.left_player) leftPic = pic.picture_path;
                    else if (pic.username === this.right_player) rightPic = pic.picture_path;
                }

                if (leftPic == null)
                    leftPic = rightPic;
                if (rightPic == null)
                    rightPic = leftPic;
            } else {
                console.warn("Erreur lors de la récupération des images de profil.");
            }
        } catch (error) {
            console.error("Erreur fetch:", error);
        }

        const playersContainer = document.createElement("div");
        playersContainer.className = "flex gap-20 items-center mb-6";

        const leftContainer = document.createElement("div");
        leftContainer.className = "flex flex-col items-center";

        // affiche les pp
        if (leftPic) {
            const img = document.createElement("img");
            img.src = "../assets/imgs/" + leftPic;
            img.alt = this.left_player;
            img.className = "w-20 h-20 rounded-full mb-2 object-cover";
            leftContainer.appendChild(img);
        }

        const leftName = document.createElement("p");
        leftName.innerText = this.left_player;
        leftName.className = "text-lg font-semibold";
        leftContainer.appendChild(leftName);

        const rightContainer = document.createElement("div");
        rightContainer.className = "flex flex-col items-center";

        if (rightPic) {
            const img = document.createElement("img");
            img.src = "../assets/imgs/" + rightPic;
            img.alt = this.right_player;
            img.className = "w-20 h-20 rounded-full mb-2 object-cover";
            rightContainer.appendChild(img);
        }

        // affiche les noms
        const rightName = document.createElement("p");
        rightName.innerText = this.right_player;
        rightName.className = "text-lg font-semibold";
        rightContainer.appendChild(rightName);

        playersContainer.appendChild(leftContainer);
        playersContainer.appendChild(rightContainer);
        this.end_screen.appendChild(playersContainer);

        // affiche les scores
        const scoresText = document.createElement("p");
        scoresText.innerText = `${this.l_score}  —  ${this.r_score}`;
        scoresText.className = "mb-8 text-xl";
        this.end_screen.appendChild(scoresText);

        // texte win
        let winner = "Match nul";
        if (this.l_score > this.r_score) winner = `${this.left_player} wins!`;
        else if (this.r_score > this.l_score) winner = `${this.right_player} wins!`;

        const winnerText = document.createElement("p");
        winnerText.innerText = winner;
        winnerText.className = "mb-10 text-2xl font-bold";
        this.end_screen.appendChild(winnerText);

        // bouton retour menu
        const btn = document.createElement("button");
        btn.innerText = "Menu";
        btn.className = `
            px-8 py-4 text-lg 
            rounded-lg bg-green-600 text-white 
            transition-colors duration-300 cursor-pointer
            hover:bg-green-700
            border-none
        `;

        // ca a change pour le tournoi (bouton qui renvoie au menu principal pour l'instant)
        btn.onclick = () => {
            this.end_screen.remove();
            this.hide_all();
            this.site.print_menu();
            this.site.print_btn_menu();
        };

        // on ajoute l'elem a la page
        this.end_screen.appendChild(btn);
        this.game_page.appendChild(this.end_screen);
    }

    hide_end_game(){
        console.log("Maybe clearing the text ?");
    }

    // Not to be added to hide_all
    hide_menu(){
        this.site.hide_menu();
    }
    
    hide_site() {
        this.site.hide_all();
    }

    hide_all(){
        this.hide_play_page();
        this.hide_game();
        this.hide_scoreboard();
    }
};

