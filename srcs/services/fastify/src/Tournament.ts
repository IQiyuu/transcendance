import {ClientSocket} from "./ClientSocket.js";
import { SiteView } from "./SiteView.js";


export class Tournament{
    
    /**CONTROLER */
    private cws : ClientSocket = null;
    private site : SiteView = null;

    /**VIEW */
    private tournament_page;
    private tournament;
    private tournament_create_btn;
    private tournament_join_btn;
    private tournament_form;

    constructor(site, cws){
        this.cws = cws;
        this.site = site;

        this.tournament_page = document.getElementById("tournament_page");
        this.tournament_create_btn = document.getElementById("tournament_create_button");
        this.tournament_form = document.getElementById("tournament_form");
        this.tournament_join_btn = document.getElementById("tournament_join_button");
        this.tournament = document.getElementById("tournament");
    }

    addEvents(){
        this.tournament_create_btn.addEventListener("click", (event) => {
            event.preventDefault();

            this.site.hide_btn_menu();
            this.print_tournament_page();
            this.print_tournament_form();
        })

        this.tournament_form.addEventListener("submit", async(event) =>{
            event.preventDefault();
            //Verifier que l'input est valide avant de l'envoyer !
            // ...
            this.tournament_form.append(document.createTextNode("Processing formulaire ;)"));
            const name = document.getElementById("tournament_name") as HTMLInputElement;
            try {
                const body = {
                    owner: this.cws.get_username(),
                    tournament_name: name.value
                }
                const resp = await fetch('/tournament/create', {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                const data = await resp.json();
                if (data.success) {
                    this.hide_tournament_form();
                    this.print_tournament(data);
                }
                else
                    throw (Error("Something unknowed occured"));
            
            } catch(error) {
                console.log("error: ", error);
            }

        });
    }

    print_tournament_page(){
        this.tournament_page.classList.replace("hidden", "flex");
    }

    hide_tournament_page(){
        this.tournament_page.classList.replace("flex", "hidden");
    }

    print_tournament(data){
        this.tournament.classList.replace("hidden", "block");
        console.log("printing " + data);
    }

    print_tournament_form(){
        this.tournament_form.classList.replace("hidden", "flex");
    }
    
    hide_tournament_form(){
        this.tournament_form.classList.replace("flex", "hidden");
    }

    hide_all(){
        this.hide_tournament_page();
    }

};
