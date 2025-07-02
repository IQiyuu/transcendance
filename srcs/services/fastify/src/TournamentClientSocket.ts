import {GameController} from "./pong.js";
import {TournamentController, Tournament} from "./TournamentController.js";

/**
 * Class used for connected client
 */
export class TournamentClientSocket{
    private ws : WebSocket = null;
    private username : string = null;

    private ctler : TournamentController = null;
    protected tournament : Tournament = null;

    // tournament historic on the same page, maybe a button to filter histo matches ?
    constructor(username : string, ctler : TournamentController, tournament : Tournament){
        this.username = username;
        this.tournament = tournament;
        this.ctler = ctler;

        this.ws = new WebSocket(`wss://${window.location.host}/tournament/${this.tournament.getId()}/ws?username=${this.username}`);
        this.setSocket();
    }

    get_username(){
        return (this.username);
    }

    setTournament(t : Tournament){
        this.tournament = t;
    }

    isReady(){
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            uname: this.username,
            state: "enter"
        }));
        return (false);
    }

    setSocket(){
        this.ws.onopen = (event) => {
            console.log("Connected to the tournament");
            this.ctler.print_tournament_rejoin_btn();
        }
        
        this.ws.onmessage = (data) => {
            console.log("Tournament got a msg");
            const message = JSON.parse(data.data);
            console.log(message);
            if (message === null){
                console.log("TODO");
                return ; // ERROR
            }
            if (message.type === "update") {
                console.log("TOUR_S : Tournament has been updated,");
                console.log(message.tournament);
                this.ctler.updateTournament(message.tournament);
            } else if (message.type === "started") {
                console.log("TOUR_S :Tournament will start in a few moments");
                this.ctler.updateTournament(message.tournament);
                this.ctler.print_tournament_state();
            } else if (message.type === "new_match"){
                console.log("TOUR_S : Creating a new tournament match");
                this.ctler.createMatch(message.game_id, message.game);
            } else if (message.type === "finished"){
                console.log("TOUR_S : Tournament is finished !");
                this.ctler.endTournament();
            } else if (message.type === "error"){
                console.log(message.message);
            }
        };


        this.ws.onclose = (event) => {
            console.log("Closing " + this.username);
            this.ctler.clear_tournament();
            this.ctler.clear_tournaments();
            this.ctler.hide_all();
            this.ctler.print_menu();
            // if server closed, then parent.err
        }
    }
    
    startTournament(){
        this.ws.send(JSON.stringify({
            type: "start"
        }));
    }

    finishTournament(){

    }

    close(){
        this.ws.close();
    }
};
