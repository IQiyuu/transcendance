import {GameController} from "./pong.js";

/**
 * Class used for connected client
 */
export class GameClientSocket{
    private ws : WebSocket = null;

    protected ctl : GameController = null;
    
    private should_search : boolean = false;
    private should_start_solo : boolean = false;
    private match_id : number = undefined; // if this number is set, then its the game id we have to connect (context : tournament)

    constructor(username : string, ctl : any, match_id ?: number){
        this.ws = new WebSocket(`wss://${window.location.host}/game/ws?username=${username}`);
        if (this.ws.readyState === this.ws.CLOSED || this.ws.readyState === this.ws.CLOSING){
            //error handling to do !
            alert("ERROR WHILE CREATING GAMESOCKET");
            return ;
        }
        this.ctl = ctl;
        if (match_id !== undefined){
            console.log("game creation socket tournament");
            this.match_id = match_id;
        }
        this.setSocket();
    }

    setSocket(){
        this.ws.onopen = (event) => {
            if (this.should_search){
                this.ws.send(JSON.stringify({
                    type: "matchmaking",
                    // username: this.ctl.getUsername(), // useless ?
                    state: "join"
                }));
                this.should_search = false;
            } else if (this.should_start_solo){
                this.ws.send(JSON.stringify({
                    type: "create_game_offline",
                    // username: this.ctl.getUsername() //useless ?
                }));
            } else if (this.match_id !== undefined){
                this.ws.send(JSON.stringify({
                    type : "tournament",
                    state : "connecting_match",
                    game_id : this.match_id
                }))
            }
        }
        
        this.ws.onmessage = (data) => {
            const message = JSON.parse(data.data);
            if (message === null)
                return ;            
            if (message.type === "game_info"){
                this.ctl.updateState(message.game);
            } else if (message.type === "matchmaking") {
                console.log("Match found");
                if (message.state === "found") {
                    this.ctl.updateState(message.game);
                    let side = (message.game.players.left === this.ctl.getUsername() ? "left" : "right")
                    this.ctl.setSide(side);
                    console.log("side = " + this.ctl.getSide());
                    this.ctl.stop_matchmaking_animation();
                    this.ctl.gameInit();
                    this.ctl.hide_all();
                    this.ctl.hide_menu();
                    this.ctl.print_play_page();
                }
            } else if (message.type === "offline_game_created"){
                this.ctl.updateState(message.game);
                this.ctl.gameInit();
                this.ctl.hide_all();
                this.ctl.hide_menu();
                this.ctl.print_play_page();
            } else if (message.type === "game_finished"){
                console.log("Game is finished");
                this.ctl.finishGame();
            } else if (message.type === "tournament"){
                if (!message.success){
                    alert("erroererer");
                } else{
                    if (message.state === "match_connected"){
                        console.log("   Match should begin");
                        this.ctl.hide_aal();
                        this.ctl.print_game();
                        this.ctl.print_play_page();
                        this.ctl.updateState(message.game);
                        this.ctl.gameInit();
                    }
                }
            }
        };

        this.ws.onclose = (event) => {
            console.log("closing socket");
            console.log(event);
            this.ctl.close();
        }

        this.ws.onerror = (event) => {
            console.log("Error");
            console.log(event);
            alert("EOROROROROROR");
        }
    }
    
    startMatchmaking(){
        if (this.ws.readyState === 0){// CONNECTING state
            this.should_search = true;
            return ;
        }
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            uname: this.ctl.getUsername(),
            state: "join"
        }));
    }

    stopMatchmaking(){
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            state: "leave"
        }));
    }

    startOfflineGame(){
        if (this.ws.readyState === 0){// CONNECTING state
            this.should_start_solo = true;
            return ;
        }
        this.ws.send(
            JSON.stringify({
                type: "create_game_offline",
                state: "create"
            })
        );
        
    }

    // Update the server with movements
    updatePos(game_id, key, side){
        // console.log("Sending " +  game_id + key + side);
        this.ws.send(JSON.stringify({
            type : "game_update",
            game_id : game_id, // useless ? server should do with socket
            move_up : key,
            side : side
        }));
    }

    close(){
        this.ws.close();
        this.should_search = false;
        this.should_start_solo = false;
        this.match_id = undefined;
    }
};
