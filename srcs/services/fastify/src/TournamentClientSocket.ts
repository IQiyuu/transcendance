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

    setSocket(){
        this.ws.onopen = (event) => {
            console.log("Connected to the tournament");
            this.ctler.print_tournament_rejoin_btn();
        }
        
        this.ws.onmessage = (message) => {
            console.log("msg recu");
            const data = JSON.parse(message.data);
            if (data === null)
                return ; // ERROR
            if (data.type === "update") {
                console.log("   tournament has been updated,");
                console.log(data.tournament);
                this.ctler.updateTournament(data.tournament);
            } else if (data.type === "started") {
                console.log("Tournament will start in a few moments");
                this.ctler.updateTournament(data.tournament);
                this.ctler.print_tournament();
            } else if (data.type === "new_match"){
                console.log("Creating a new tournament match");
                this.ctler.createMatch(data.game_id, data.game);
            } else if (data.type === "finished"){
                console.log("Tournament is finished !");
            } else if (data.type === "error"){
                console.log(data.message);
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
        console.log("Starting tournament ?");
        this.ws.send(JSON.stringify({
            type: "start"
        }));
    }

    finishGame(){

    }

    close(){
        this.ws.close();
    }
};
