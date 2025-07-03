import { SiteController } from "./SiteController.js";
import {GameController} from "./pong.js";
import { TournamentClientSocket } from "./TournamentClientSocket.js";

const T_STARTING = 0;
const T_READY = 1;
const T_ON_GOING = 2;
const T_FINISHED = 3;

export class Tournament {
    private id : number;
    private name : string;
    private owner : string;
    private players; // image, win rate{}
    private brackets; // ordered array of ordered array of {username, username, state, winner}


    constructor(tournament) {
        this.id = tournament.id;
        this.name = tournament.name;
        this.owner = tournament.owner;
        this.players = tournament.players;
        this.brackets = null;
    }

    getId() {
        return (this.id);
    }

    getName() {
        return (this.name);
    }

    getOwner() {
        return (this.owner);
    }

    getPlayers(){
        return (this.players);
    }

    getBrackets(){
        return (this.brackets);
    }

    isStarted(){
        // console.log(this.brackets);
        return (this.brackets !== null);
    }

    update(tournament){
        this.players = tournament.players;
        if (tournament.brackets !== null )
            this.brackets = tournament.brackets;
        // console.log(tournament.brackets);
    }

}

function verifyForm(name){
    if (name.value.length < 1)
        return (alert("Tournament's name should have at least 3 characters"), false);
    if (name.value.length > 20)
        return (alert("Tournament's name too long"), false);
    // if (/[alnum]|_*|-*/.test(name.value))
    //     return (alert("Characters can only be letters, digits, and - or _"), false);
    return (true);
}

export class TournamentController {

    /**CONTROLLER */
    private ws: TournamentClientSocket = null;
    private site: SiteController = null;
    private username: string = null;
    private tournament: Tournament = null;
    private game: GameController;

    /**VIEW */
    private tournament_page = document.getElementById("tournament_page");
    private tournaments_page = document.getElementById("tournaments_join");
    private tournament_div = document.getElementById("tournament");
    private tournament_lobby = document.getElementById("tournament_lobby");
    private tournament_state = document.getElementById("tournament_state");
    private tournaments_list = document.getElementById("tournaments_list");
    private tournament_form = document.getElementById("tournament_form");
    private tournament_create_btn = document.getElementById("tournament_create_button");
    private tournament_join_btn = document.getElementById("tournament_join_button");
    private tournament_rejoin_btn = document.getElementById("tournament_rejoin_button");

    constructor(site : SiteController, game : GameController) {
        this.site = site;
        this.game = game;
    }

    setUsername(username) {
        this.username = username;
    }

    hasTournament(){
        return (this.tournament !== null);
    }

    addEvents() {
        this.tournament_create_btn.addEventListener("click", (event) => {
            event.preventDefault();

            if (this.tournament !== null) {
                alert("You're already registered for a tournament");
                return;
            }
            this.site.hide_all();

            this.print_tournament_page();
            this.print_tournament_form();
        })

        this.tournament_form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const name = document.getElementById("tournament_name") as HTMLInputElement;
            //Verifier que l'input est valide avant de l'envoyer !
            if (!verifyForm(name)){
                // Error to print here (or in verifyForm) ?
                return ;
            }
            try {
                const body = {
                    owner: this.username,
                    tournament_name: name.value
                }
                const resp = await fetch('/tournament/create', {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                const data = await resp.json();
                if (data.success) {
                    this.tournament = new Tournament(data.tournament);
                    this.ws = new TournamentClientSocket(this.username, this, this.tournament);
                    this.hide_all();
                    this.print_tournament();
                }
                else
                    throw (Error(data.error));
            } catch (error) {
                console.log("error: ", error);
            }
        });

        this.tournament_join_btn.addEventListener("click", async (event) => {
            event.preventDefault();

            try {
                const resp = await fetch('/tournament/list?username=' + this.username, {
                    method: 'GET',
                    headers: { "Content-Type": "application/json" }
                });
                const data = await resp.json();

                // console.log(data);

                if (data.success) {
                    if (data.tournaments !== null && data.tournaments !== undefined) {
                        let i = 0, size = data.tournaments.length;
                        let list = document.createElement("ul");
                        if (size == 0)
                            this.tournaments_list.append(document.createTextNode("No tournament found. Try creating one !"));
                        else {
                            list.appendChild(document.createTextNode("List of tournaments available"));
                            while (i < size) {
                                let el = document.createElement("li");
                                el.appendChild(document.createTextNode(data.tournaments[i].name));
                                el.appendChild(document.createTextNode(data.tournaments[i].players.length + "/" + "8"));
                                el.setAttribute("tournament_id", data.tournaments[i].id);
                                el.addEventListener("click", async (event) => {
                                    event.preventDefault();
                                    // We test if we can join the tournament
                                    try {
                                        let query = new URLSearchParams();
                                        query.append("username", this.username);
                                        let url = '/tournament/join/' + (event.target as Element).getAttribute("tournament_id") + `?${query}`;
                                        const resp = await fetch(url, {
                                            method: 'GET',
                                            headers: { "Content-Type": "application/json" }
                                        });
                                        const data = await resp.json();
                                        if (data.success) {
                                            this.tournament = new Tournament(data.tournament);
                                            this.ws = new TournamentClientSocket(this.username, this, this.tournament);
                                            this.site.hide_all();
                                            this.print_tournament();
                                        } else{
                                            const T_DSNT_EXISTS = 999;
                                            if (data.code === T_DSNT_EXISTS){
                                                alert("This tournament doesnt exists");
                                            }
                                            throw Error(data.error);
                                        }
                                    } catch (error) {
                                        console.log(error);
                                    }
                                });
                                list.append(el);
                                i++;
                            }
                            this.tournaments_list.appendChild(list);
                        }
                    } else
                        throw (Error(data.error));
                }
            } catch (err) {
                console.log(err);
            }
            this.site.hide_all();

            this.print_tournament_page();
            this.print_tournaments_page();
            this.clear_tournaments();
        });

        this.tournament_rejoin_btn.addEventListener("click", async (event) => {
            // this.clear_tournament();
            this.site.hide_all();
            this.print_tournament();
        });
    }

    updateTournament(tournament : Tournament){
        this.tournament.update(tournament);
        // this.clear_tournament();
        // this.site.hide_all();
        this.print_tournament();
        // this.print_tournament_lobby();
        // this.print_tournament_page();
    }

    createMatch(game_id, game){
        console.log("Telling GameCtrler to create the tournament match :");
        console.log(game);
        this.game.startTournamentGame(game_id, game);
    }

    endTournament(){
        // this.tournament = null;
        // this.ws.close();
        // this.ws = null;
        console.log("EndingTOurnament");
        this.game.close()
        this.tournament = null
    }
    /**
     * VIEW METHODS
     * 
     */
    print_menu(){
        this.site.print_menu();
    }

    print_tournament_page() {
        this.tournament_page.classList.replace("hidden", "flex");
    }

    hide_tournament_page() {
        this.tournament_page.classList.replace("flex", "hidden");
    }

    print_tournaments_page() {
        this.tournaments_page.classList.replace("hidden", "flex");
    }

    hide_tournaments_page() {
        this.tournaments_page.classList.replace("flex", "hidden");
    }

    print_tournament_div(){
        this.tournament_div.classList.replace("hidden", "block");
    }

    hide_tournament_div(){
        this.tournament_div.classList.replace("block", "hidden");
    }

    print_tournament_lobby(){
        // To recheck 
        // console.log("Printing tournament lobby ( I have this :");
        // console.log(this.tournament);
        if (this.tournament === null){
            alert("Not implemented yet (print tournament but tournament is null)");
            return ;
        }

        let title = document.createElement("h3");
        title.append(document.createTextNode(this.tournament.getName()));

        let table = document.createElement("table");

        //First line
        let tr = document.createElement("tr");
        let th = document.createElement("th");

        th.append(document.createTextNode("User"));
        tr.append(th);

        th = document.createElement("th");
        th.append(document.createTextNode("Role"));
        tr.append(th);

        table.append(tr);

        //Each player info
        this.tournament.getPlayers().forEach(p => {
            tr = document.createElement("tr");
            th = document.createElement("th");

            th.append(document.createTextNode(p));
            tr.append(th);

            th = document.createElement("th");
            if (p === this.tournament.getOwner()) {
                th.append(document.createTextNode("Owner"));
            }
            else {
                th.append(document.createTextNode("Player"));
            }
            tr.append(th);
            table.append(tr);
        });
        this.tournament_lobby.append(title);
        this.tournament_lobby.append(table);

        if (!this.tournament.isStarted()){
            console.log("   Tournament has not started yet");
            if (this.username === this.tournament.getOwner()) {
                let start_button = document.createElement("button");
                start_button.append(document.createTextNode("Start"));
                start_button.onclick = (event) => this.startTournamentHandler(event);
                this.tournament_lobby.append(start_button);
            }
            let leave_button = document.createElement("button");
            leave_button.append(document.createTextNode("Leave"));
            leave_button.onclick = (event) => this.leaveTournamentHandler(event);
            this.tournament_lobby.append(leave_button);
        }
        this.tournament_lobby.classList.replace("hidden", "block");
    }

    hide_tournament_lobby(){
        this.tournament_lobby.classList.replace("block", "hidden");
    }

    clear_tournament_lobby(){
        this.tournament_lobby.textContent = ''
    }

    print_tournament_state(){
        // this.tournament_state.style.height="80";
        // this.tournament_state.style.width="60";
        let brackets = this.tournament.getBrackets();
        if (brackets === undefined || brackets === null){
            // console.log("TOurnament not started")
            return ;
        }

        // console.log("Printing state :");
        let nb_round = brackets.length;
        let table = document.createElement("table");
        for (let i = 0; i < nb_round ; i++){
            console.log(brackets[i]);
            let nb_match = brackets[i].length;
            let round = document.createElement("tr");
            round.style.margin = "10 px";
            for (let j = 0 ; j < nb_match ; j++){
                let match = document.createElement("td");
                let winner = brackets[i][j].winner;

                console.log(brackets[i][j]);

                let p1 = document.createElement("p");
                p1.innerText = brackets[i][j].p1;
                if (winner !== null)
                    p1.style.backgroundColor = (winner === brackets[i][j].p1 ? "green" : "red");
                match.appendChild(p1);
                match.style.padding = "1em";
                match.style.border = "solid";
                if (brackets[i][j].p2 !== null){
                    let p2 = document.createElement("p");
                    match.append(document.createTextNode(" VS "))
                    p2.append(document.createTextNode(brackets[i][j].p2));
                    if (winner !== null)
                        p2.style.backgroundColor = (winner === brackets[i][j].p2 ? "green" : "red");
                    match.appendChild(p2);
                }
                // match.innerText = "M";
                round.append(match);
            }
            table.append(round);
        }
        this.tournament_state.append(table);

        this.tournament_state.classList.replace("hidden", "block");
    }

    hide_tournament_state(){
        this.tournament_state.classList.replace("block", "hidden");
    }

    clear_tournament_state(){
        this.tournament_state.textContent = '';
    }

    print_tournament(){
        this.clear_tournament_lobby();
        this.print_tournament_lobby();
        this.clear_tournament_state();
        this.print_tournament_state();
        this.print_tournament_div();
        this.print_tournament_page();
    }

    hide_tournament(){
        this.tournament_div.classList.replace("block", "hidden");
    }

    async leaveTournamentHandler(event) {
        event.preventDefault();

        try {
            let query = new URLSearchParams();
            query.append("username", this.username);
            console.log("Trying to leave ");
            console.log(this.tournament);
            let url = '/tournament/leave/' + this.tournament.getId() + `?${query}`;

            const resp = await fetch(url, {
                method: 'GET'
            });

            const data = await resp.json();
            if (data.success) {
                this.tournament = null;
                this.hide_all();
                this.ws.close();
                this.ws = null;
                this.tournament_join_btn.dispatchEvent(new MouseEvent("click"));
            } else {
                console.log("Didnt leave");
                throw (Error(data.error));
            }
        } catch (error) {
            console.log(error);
        }
    }

    async startTournamentHandler(event) {
        this.ws.startTournament();
    }

    print_tournament_form() {
        this.tournament_form.classList.replace("hidden", "flex");
    }

    hide_tournament_form() {
        this.tournament_form.classList.replace("flex", "hidden");
    }

    print_tournament_rejoin_btn(){
        this.tournament_rejoin_btn.classList.replace("hidden", "flex");
    }

    hide_tournament_rejoin_btn(){
        this.tournament_rejoin_btn.classList.replace("flex", "hidden");
    }

    print_tournament_end(){
        console.log("ToURNAMENT END");
    }

    clear_tournaments() {
        this.tournaments_list.textContent = '';
    }

    hide_all() {
        this.hide_tournament_page();
        this.hide_tournaments_page();
        this.hide_tournament_div();
        this.hide_tournament_form();
        this.hide_tournament_lobby();
        this.hide_tournament_state();
        this.hide_tournament_rejoin_btn();
        this.hide_tournament();
    }
};
