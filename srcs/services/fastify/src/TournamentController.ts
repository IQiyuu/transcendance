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
    public finished_tournament: Tournament = null;
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

    private tournament_end_page = document.getElementById("tournament_end");

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

            if (this.game.isPlaying()){
                alert("You can't join a tournament while playing or searching for a game !");
                return ;
            }
            if (this.tournament !== null) {
                alert("You're already registered for a tournament");
                return;
            }
            this.site.hide_all();

            this.print_tournament_page();
            this.print_tournament_form();
        });

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
            
            if (this.game.isPlaying()){
                alert("You can't join a tournament while playing or searching for a game !");
                return ;
            }
            if (this.tournament !== null) {
                alert("You're already registered for a tournament");
                return;
            }

            this.clear_tournaments();

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
                            this.tournaments_list.append(document.createTextNode(this.site.getText("no_tour")));
                        else {
                            list.appendChild(document.createTextNode(this.site.getText("lst_tour")));
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
        });

        this.tournament_rejoin_btn.addEventListener("click", async (event) => {
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
        // console.log("Telling GameCtrler to create the tournament match :");
        // console.log(game);
        this.game.startTournamentGame(game_id, game);
    }

    endTournament(){
        console.log("EndingTournament");
        this.clear_tournament_lobby();
        this.hide_tournament_lobby();
        this.finished_tournament = this.tournament;
        this.close()
        this.print_tournament_end();
    }

    close(){
        this.game.close();
        if (this.ws != null)
            this.ws.close();
        this.ws = null;
        this.tournament = null;
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
        this.tournaments_page.classList.replace("hidden", "block");
    }

    hide_tournaments_page() {
        this.tournaments_page.classList.replace("block", "hidden");
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
        title.className = "text-2xl font-bold text-white mb-4 text-center";
        title.append(document.createTextNode(this.tournament.getName()));

        let table = document.createElement("table");
        table.className = "min-w-full bg-gray-800 rounded-lg overflow-hidden shadow-md";

        // First row (thead style)
        let tr = document.createElement("tr");

        let th = document.createElement("th");
        th.className = "px-4 py-2 text-left text-sm font-semibold text-gray-300 bg-gray-700";
        th.id="usr_tour";
        th.append(document.createTextNode(this.site.getText("usr_tour")));
        tr.append(th);

        th = document.createElement("th");
        th.className = "px-4 py-2 text-left text-sm font-semibold text-gray-300 bg-gray-700";
        th.id="role_tour";
        th.append(document.createTextNode(this.site.getText("role_tour")));
        tr.append(th);

        table.append(tr);

        // Each player row
        this.tournament.getPlayers().forEach(p => {
            tr = document.createElement("tr");

            th = document.createElement("td");
            th.className = "px-4 py-2 text-white border-t border-gray-600";
            th.append(document.createTextNode(p));
            tr.append(th);

            th = document.createElement("td");
            th.className = "px-4 py-2 text-white border-t border-gray-600";

            if (p === this.tournament.getOwner()) {
                th.id = "own_tour";
                th.append(document.createTextNode(this.site.getText("own_tour")));
            } else {
                th.classList.add("play_tour");
                th.append(document.createTextNode(this.site.getText("play_tour")));
            }

            tr.append(th);
            table.append(tr);
        });

        this.tournament_lobby.append(title);
        this.tournament_lobby.append(table);
   
        if (!this.tournament.isStarted()){
            // console.log("   Tournament has not started yet");
            if (this.username === this.tournament.getOwner()) {
                let start_button = document.createElement("button");
                start_button.id = "start_tour";
                start_button.append(document.createTextNode(this.site.getText("start_tour")));
                start_button.className = "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-4";
                start_button.onclick = (event) => this.startTournamentHandler(event);
                this.tournament_lobby.append(start_button);
            }
            let leave_button = document.createElement("button");
            leave_button.id = "leav_tour";
            leave_button.append(document.createTextNode(this.site.getText("leav_tour")));
            leave_button.className = "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded";
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
        this.hide_tournament_lobby();
        if (!this.tournament.isStarted())
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
            console.log(this.tournament);
            let url = '/tournament/leave/' + this.tournament.getId() + `?${query}`;

            const resp = await fetch(url, {
                method: 'GET'
            });

            const data = await resp.json();
            if (data.success) {
                this.tournament = null;
                this.hide_all();
                if (this.ws != null)
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

    generateBracketElement(brackets) {
        const container = document.createElement("div");
        container.className = "flex justify-center gap-6 my-6";

        const matchHeight = 60;

        for (let i = 0; i < brackets.length; i++) {
            const round = document.createElement("div");
            round.className = "flex flex-col items-center";
            if (i > 0) round.style.paddingTop = `${(matchHeight / 2) * i + 25}px`;

            for (let j = 0; j < brackets[i].length; j++) {
                const match = document.createElement("div");
                match.className = "bg-black border border-white rounded-md shadow-lg px-4 py-3 mb-6 text-center w-36";

                const p1 = document.createElement("p");
                p1.innerText = brackets[i][j].p1;
                p1.className = "font-semibold mb-1";
                if (brackets[i][j].winner)
                    p1.classList.add(
                        brackets[i][j].winner === brackets[i][j].p1 ? "bg-green-700" : "bg-red-700",
                        "text-white", "rounded", "px-1"
                    );
                match.appendChild(p1);

                if (brackets[i][j].p2 !== null) {
                    const vs = document.createElement("span");
                    vs.innerText = " VS ";
                    vs.className = "text-white font-bold";
                    match.appendChild(vs);

                    const p2 = document.createElement("p");
                    p2.innerText = brackets[i][j].p2;
                    p2.className = "font-semibold";
                    if (brackets[i][j].winner)
                        p2.classList.add(
                            brackets[i][j].winner === brackets[i][j].p2 ? "bg-green-700" : "bg-red-700",
                            "text-white", "rounded", "px-1"
                        );
                    match.appendChild(p2);
                }

                round.appendChild(match);
            }

            container.appendChild(round);
        }

        return container;
    }

    print_tournament_end() {

        if (this.finished_tournament === null){
            return ;
        }
        const brackets = this.finished_tournament.getBrackets();
        if (!brackets || brackets.length === 0) return;

        // Récupérer le gagnant depuis le dernier match
        const lastRound = brackets[brackets.length - 1];
        const lastMatch = lastRound[0];
        const winner = lastMatch.winner;
        const isWinner = (winner === this.username);

        // Créer l'overlay de fin
         
        this.tournament_end_page.className = "hidden fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 text-white";

        // Titre principal (Gagné / Perdu)
        const title = document.createElement("h2");
        title.id = isWinner ? "tour_win_msg" : "tour_lose_msg";
        title.className = "text-4xl font-bold mb-6";
        title.textContent = isWinner
            ? this.site.getText("tour_win_msg")
            : this.site.getText("tour_lose_msg");
        this.tournament_end_page.appendChild(title);

        // Sous-titre "Bracket"
        const bracketTitle = document.createElement("h3");
        bracketTitle.className = "text-2xl font-semibold mb-4";
        bracketTitle.textContent = this.site.getText("tour_bracket");
        this.tournament_end_page.appendChild(bracketTitle);

        // Bracket visuel
        const bracketTable = this.generateBracketElement(brackets);
        this.tournament_end_page.appendChild(bracketTable);

        // Bouton quitter
        const btn = document.createElement("button");
        btn.id = "tour_quit_btn";
        btn.className = "mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded";
        btn.textContent = this.site.getText("tour_quit_btn");
        btn.addEventListener("click", async (event) => {
            this.hide_all();
            this.site.print_menu();
            this.finished_tournament = null;
            this.tournament_end_page.textContent = '';
        });
        this.tournament_end_page.appendChild(btn);

        this.hide_all()
        this.print_tournament_end_page();
    }

    print_tournament_end_page(){
        this.tournament_page.classList.replace("hidden", "block");
        this.tournament_div.classList.replace("hidden", "block");
        this.tournament_end_page.classList.replace("hidden", "block");
    }

    hide_tournament_end_page(){
        this.tournament_end_page.classList.replace("block", "hidden");
    }

    clear_tournaments() {
        this.tournaments_list.textContent = '';
    }

    hide_all() {
        this.hide_tournament_page();
        this.hide_tournament_end_page();
        this.hide_tournaments_page();
        this.hide_tournament_div();
        this.hide_tournament_form();
        this.hide_tournament_lobby();
        this.hide_tournament_state();
        this.hide_tournament_rejoin_btn();
        this.hide_tournament();
    }
};