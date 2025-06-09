import {GameController} from "./pong.js";

/**
 * Class used for connected client
 */
export class GameClientSocket{
    private ws : WebSocket = null;
    private username : string;

    protected game : GameController = null;
    
    private should_search : boolean = false;
    private should_start_solo : boolean = false;

    constructor(username, game){
        this.username = username;
        this.ws = new WebSocket(`wss://${window.location.host}/game/ws?username=${this.username}`);
        if (this.ws.readyState === this.ws.CLOSED || this.ws.readyState === this.ws.CLOSING){
            //error handling to do !
            return ;
        }
        this.game = game;
        this.setSocket();
    }

    get_username(){
        return (this.username);
    }

    // set_game(g : GameController){
    //     this.game = g;
    // }

    setSocket(){
        this.ws.onopen = (event) => {
            if (this.should_search){
                this.ws.send(JSON.stringify({
                    type: "matchmaking",
                    uname: this.username,
                    state: "enter"
                }));
                this.should_search = false;
            }
        }
        
        this.ws.onmessage = (message) => {
            console.log("msg recu");
            const data = JSON.parse(message.data);
            if (data === null)
                return ;

            if (data.type === "game_info"){
                this.game.updateState(data.game);
            } else if (data.type === "matchmaking") {
                if (data.state === "found") {
                    this.game.updateState(data.game);

                    this.game.stop_matchmaking_animation();
                    this.game.hide_all();
                    this.game.print_play_page();
                }
            }else if (data.type === "offline_game_created"){
                this.game.gameInit();
                this.game.updateState(data.game);

                this.game.hide_all();
                this.game.print_play_page();
            }
        };

        this.ws.onclose = (event) => {
            console.log("closing socket");
            console.log(event);
            this.game.close();
        }
    }
    
    startMatchmaking(){
        console.log("Trying to start matchmaking");
        if (this.ws.readyState === 0){// CONNECTING state
            this.should_search = true;
            return ;
        }
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            uname: this.username,
            state: "enter"
        }));
    }

    stopMatchmaking(){
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            state: "left"
        }));
    }

    startOfflineGame(){
        if (this.ws.readyState === 0){// CONNECTING state
            this.should_start_solo = true;
            return ;
        }
        this.ws.send(
            JSON.stringify({
                type: "offline_game",
                state: "create"
            })
        );
    }

    // Tell the server game is ready to start
    sayReady(){
        this.ws.send(JSON.stringify({
            type : "game_start"
        }));
    }

    // Update the server with movements
    updatePos(game_id, key, side){
        console.log("Sending " +  game_id + key + side);
        this.ws.send(JSON.stringify({
            type : "game_update",
            game_id : game_id,
            move_up : key,
            side : side
        }));
    }

    close(){
        this.ws.close();
        this.should_search = false;
        this.should_start_solo = false;
    }
};
