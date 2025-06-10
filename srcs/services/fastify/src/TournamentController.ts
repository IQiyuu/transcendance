import { TournamentClientSocket } from "./TournamentClientSocket.js";
import { SiteController } from "./SiteController.js";

export class Tournament {
    private id;
    private name;
    private owner;
    private players; // image, win rate{}


    constructor(tournament) {
        this.id = tournament.id;
        this.name = tournament.name;
        this.owner = tournament.owner;
        this.players = tournament.players;
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

}

export class TournamentController {

    /**CONTROLLER */
    private cws: TournamentClientSocket = null;
    private site: SiteController = null;
    private username: string = null;
    private tournament: Tournament = null;

    /**VIEW */
    private tournament_page;
    private tournaments_page;

    private tournament_div;
    private tournaments_list;

    private tournament_form;

    private tournament_create_btn;
    private tournament_join_btn;

    constructor(site) {
        this.site = site;

        this.tournament_page = document.getElementById("tournament_page");
        this.tournaments_page = document.getElementById('tournaments_join');

        this.tournament_form = document.getElementById("tournament_form");
        this.tournament_div = document.getElementById("tournament");
        this.tournaments_list = document.getElementById('tournaments_list');

        this.tournament_create_btn = document.getElementById("tournament_create_button");
        this.tournament_join_btn = document.getElementById("tournament_join_button");
    }

    setUsername(username) {
        this.username = username;
    }


    addEvents() {
        this.tournament_create_btn.addEventListener("click", (event) => {
            event.preventDefault();

            // if (this.tournament !== null && this.tournament !== undefined){
            if (this.tournament !== null) {
                // print_error("You're already registered for a tournament");
                alert("You're already registered for a tournament");
                return;
            }
            this.site.hide_all();

            this.print_tournament_page();
            this.print_tournament_form();
        })

        this.tournament_form.addEventListener("submit", async (event) => {
            event.preventDefault();
            //Verifier que l'input est valide avant de l'envoyer !
            // ...
            const name = document.getElementById("tournament_name") as HTMLInputElement;
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
                    this.cws = new TournamentClientSocket(data.tournament.id, this.username, this, this.tournament);
                    console.log(this.tournament);
                    this.hide_tournament_form();
                    this.print_tournament(data.tournament);
                }
                else
                    throw (Error(data.error));
            } catch (error) {
                console.log("error: ", error);
            }
        });

        this.tournament_join_btn.addEventListener("click", async (event) => {
            event.preventDefault();

            this.site.hide_all();

            this.print_tournament_page();
            this.print_tournaments_page();
            this.clear_tournaments();
            try {
                const resp = await fetch('/tournament/list?username=' + this.username, {
                    method: 'GET',
                    headers: { "Content-Type": "application/json" }
                });
                const data = await resp.json();

                console.log(data);

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
                                            this.cws = new TournamentClientSocket(data.tournament.id, this.username, this, this.tournament);

                                            console.log(this.tournament);

                                            this.site.hide_all();
                                            this.clear_tournament();
                                            this.print_tournament_page();
                                            this.print_tournament(data.tournament);
                                        } else
                                            throw Error(data.error);
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
        });
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

    print_tournament(tournament) {
        this.tournament_div.classList.replace("hidden", "block");
        console.log("printing " + tournament);

        let title = document.createElement("h3");
        title.append(document.createTextNode(tournament.name));

        let table = document.createElement("table");
        table.append();

        //First line
        let tr = document.createElement("tr");
        let th = document.createElement("th");

        th.append(document.createTextNode("User"));
        tr.append(th);

        th = document.createElement("th");
        th.append(document.createTextNode("Role"));
        tr.append(th);

        table.append(tr);

        //Next lines
        tournament.players.forEach(p => {
            tr = document.createElement("tr");
            th = document.createElement("th");

            th.append(document.createTextNode(p));
            tr.append(th);

            th = document.createElement("th");
            if (p === tournament.owner) {
                th.append(document.createTextNode("Owner"));
            }
            else {
                th.append(document.createTextNode("Player"));
            }
            tr.append(th);
            table.append(tr);
        });

        this.tournament_div.append(title);
        this.tournament_div.append(table);

        if (this.username === tournament.owner) {
            let start_button = document.createElement("button");
            start_button.append(document.createTextNode("Start"));
            start_button.onclick = (event) => this.startTournamentHandler(event);
            this.tournament_div.append(start_button);
        }

        let leave_button = document.createElement("button");
        leave_button.append(document.createTextNode("Leave"));

        leave_button.onclick = (event) => this.leaveTournamentHandler(event);
        // leave_button.addEventListener("click", this.leaveTournamentHandler);

        // leave_button.addEventListener("click", async(event) => {
        //     event.preventDefault();
        //     console.log("Trying to leave so soon ?");

        //     try{
        //         // fetch HERE TODO
        //         let query = new URLSearchParams();
        //         query.append("username", this.username);
        //         console.log("Trying to leave ");
        //         console.log(this.tournament);
        //         let url = '/tournament/leave/' + this.tournament.getId() + `?${query}`;

        //         const resp = await fetch(url, {
        //             method: 'GET'
        //         });

        //         const data = await resp.json();
        //         if (data.success){
        //             this.tournament = null;
        //             this.hide_all();
        //             this.cws.close();
        //             this.cws = null;
        //             this.print_tournament_page();
        //         }else{
        //             console.log("Didnt leave");
        //             throw (Error(data.error));
        //         }
        //     } catch (error){
        //         console.log(error);
        //     }
        // });
        this.tournament_div.append(leave_button);
    }

    async leaveTournamentHandler(event) {
        event.preventDefault();
        console.log("Trying to leave so soon ?");

        try {
            // fetch HERE TODO
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
                this.cws.close();
                this.cws = null;
                this.print_tournament_page();
            } else {
                console.log("Didnt leave");
                throw (Error(data.error));
            }
        } catch (error) {
            console.log(error);
        }
    }

    async startTournamentHandler(event) {
        if (this.cws.isReady()){
            this.cws.startTournament();
        }
    }

    hide_tournament() {
        this.tournament_div.classList.replace("block", "hidden");
    }

    print_tournament_form() {
        this.tournament_form.classList.replace("hidden", "flex");
    }

    hide_tournament_form() {
        this.tournament_form.classList.replace("flex", "hidden");
    }

    clear_tournament() {
        this.tournament_div.textContent = '';
    }

    clear_tournaments() {
        this.tournaments_list.textContent = '';
    }

    hide_all() {
        this.hide_tournament_page();
        this.hide_tournaments_page();
        this.hide_tournament_form();
        this.hide_tournament();
    }
};
