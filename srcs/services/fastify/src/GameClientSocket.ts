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
            alert("ERROR WHILE CREAtING GAMESOCKET");
            return ;
        }
        this.game = game;
        this.setSocket();
    }

    get_username(){
        return (this.username);
    }

    setSocket(){
        this.ws.onopen = (event) => {
            if (this.should_search){
                this.ws.send(JSON.stringify({
                    type: "matchmaking",
                    username: this.username,
                    state: "join"
                }));
                this.should_search = false;
            } else if (this.should_start_solo){
                this.ws.send(JSON.stringify({
                    type: "create_game_offline",
                    username: this.username
                }));
            }
        }
        
        this.ws.onmessage = (data) => {
            const message = JSON.parse(data.data);
            // console.log(message);
            if (message === null)
                return ;            
            if (message.type === "game_info"){
                this.game.updateState(message.game);
            } else if (message.type === "matchmaking") {
                console.log("Match found");
                console.log(message);
                if (message.state === "found") {
                    this.game.updateState(message.game);
                    this.game.setSide((game) => {
                        return (game.players.left === this.username ? "left" : "right");
                    });
                    console.log("side = " + this.game.getSide());
                    this.game.stop_matchmaking_animation();
                    this.game.gameInit();
                    this.game.hide_all();
                    this.game.print_play_page();
                }
            } else if (message.type === "offline_game_created"){
                this.game.updateState(message.game);
                this.game.gameInit();
                this.game.hide_all();
                this.game.print_play_page();
            } else if (message.type === "game_finished"){
                console.log("Game is finished");
                this.game.finishGame();
                this.ws.close();
            }
        };

        this.ws.onclose = (event) => {
            console.log("closing socket");
            console.log(event);
            this.game.close();
        }
    }
    
    startMatchmaking(){
        if (this.ws.readyState === 0){// CONNECTING state
            this.should_search = true;
            return ;
        }
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            uname: this.username,
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
    }
};
