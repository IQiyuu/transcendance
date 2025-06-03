import {Game} from "./pong.js";
import {TournamentView, Tournament} from "./Tournament.js";

/**
 * Class used for connected client
 */
export class TournamentClientSocket{
    private ws : WebSocket = null;
    private username : string = null;
    private id : number = null;
    private view = null;

    // protected game : Game = null;
    protected tournament : Tournament = null;

    constructor(id : number, username : string, view : TournamentView, tournament : Tournament){
        this.id = id;
        this.username = username;
        this.tournament = tournament;
        this.view = view;

        this.ws = new WebSocket(`wss://${window.location.host}/tournament/${this.id}/ws?username=${this.username}`);
        this.initSocket();
    }

    get_username(){
        return (this.username);
    }

    setTournament(t : Tournament){
        this.tournament = t;
    }

    initSocket(){
        this.ws.onopen = (event) => {
            console.log("Tournament connected");
        }
        
        this.ws.onmessage = (message) => {
            console.log("msg recu");
            const data = JSON.parse(message.data);
            if (data === null)
                return ; // ERROR
            console.log("You got a mail, ", data.type);
            if (data.type == "connection") {

            }
        };

        this.ws.onclose = (event) => {
            console.log("Closing " + this.username);
            // if server closed, then parent.err
        }
    }
    
    start_matchmaking(){
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            uname: this.username,
            state: "enter"
        }));
    }

    stop_matchmaking(){
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            state: "left"
        }));
    }

    // Tell the server game is ready to start
    say_ready(){
        this.ws.send(JSON.stringify({
            type : "game_start"
        }));
    }

    // Update the server with movements
    update_pos(game_id, key, side){
        console.log("Sending " +  game_id + key + side);
        this.ws.send(JSON.stringify({
            type : "game_update",
            game_id : game_id,
            moveUp : key,
            side : side
        }));
    }

    print_info(){
        console.log("Websocket for : " + this.username);
    }

    close(){
        this.ws.close();
    }
};
