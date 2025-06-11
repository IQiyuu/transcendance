import {ClientSocket} from "./ClientSocket.js";
import { LangController } from "./LangContoller.js";
import {GameClientSocket} from "./GameClientSocket.js";
// import {Game} from "./pong.js";
import {GameController} from "./pong.js";
import {TournamentController} from "./TournamentController.js";
import { FriendController } from "./FriendController.js";

export class   ProfileController{

    private	username : string = "default name";

    private	profile_username : string = null;

    private	picture_path : string = "imgs/standart.jpg";
    private	register_date : string = "placeholder";

    private	histo = null;

    private	site : SiteController = null;

    //View
    private	profile_page = document.getElementById("player_profile");
    private	search_btn = document.getElementById("search_player_btn");
    private	search_inp = document.getElementById("search_player_in") as HTMLInputElement;
    private	friend_div = document.getElementById("friend_div");
    private	fa_btn = document.getElementById("fa_btn");
	
    private	histo_list = document.getElementById("histo_list");

    private	camera_icon = document.getElementById("camera_icon");
    private	profile_picture = document.getElementById("profile_picture");
    private	profile_picture_overlay = document.getElementById("profile_picture_overlay");

    private	profile_username_tag = document.getElementById("profile_username");
    private	register_date_tag = document.getElementById("profile_creation");

    constructor(site){
        this.site = site;
    }

    setUsername(username){
        this.username = username;
    }

    setProfileUsername(u){
        this.profile_username = u;
    }

    addEvents(){

        // Player's search
        this.search_inp.addEventListener("keydown", async (event) => {
            if (event.key == 'Enter') {
                this.profile_username = this.search_inp.value;
                await this.searchPlayerHandler();
                this.printPage();
            }
        });

        this.search_btn.addEventListener("click", async (event) => {
            event.preventDefault();
            this.profile_username = this.search_inp.value;
            console.log(this.profile_username);
            await this.searchPlayerHandler();
            this.printPage();
        });

        //Telling user we are changing profile's picture
        this.profile_picture.addEventListener("click", () => {
            if (this.username == this.profile_username) {
                this.camera_icon.classList.replace("opacity-60", "opacity-0");
                this.profile_picture_overlay.classList.replace("hidden", "flex");
            }
        });

        this.camera_icon.addEventListener("click", async (event) => {
            if (this.profile_username == this.username){
                this.camera_icon.classList.replace("opacity-60", "opacity-0");
                this.profile_picture_overlay.classList.replace("hidden", "flex");
            }
        });

        // hover sur la photo de profile
        this.profile_picture.addEventListener("mouseover", async (event) => {
            const user_page = document.getElementById("profile_username").textContent;
            if (this.profile_username == this.username)
                this.camera_icon.classList.replace("opacity-0", "opacity-60");
        });

        this.profile_picture.addEventListener('mouseout', () => {
            const user_page = document.getElementById("profile_username").textContent;
            if (this.profile_username == this.username)
                this.camera_icon.classList.replace("opacity-60", "opacity-0");
        });

    }

    //Search for the player, and store datas
    async	searchPlayerHandler(){
        try {
            const req = await fetch(`/profile/${this.profile_username}`, {
                method: 'GET',
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
            });

            const data = await req.json();

            if (!data.success){
				this.profile_username = this.username;
                throw (Error(data.message)); // Fait du rouge, a modifier
			}
            console.log(data);
            this.profile_username = data.profile.username;
            this.register_date = data.profile.created_at;
            this.picture_path = data.profile.picture_path;
        } catch (error){
            console.log(error);
        }
    }

    async	searchHistoricHandler(){
        try {
            const req = await fetch(`/historic/${this.profile_username}`, {
                method: 'GET',
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
            });

            const data = await req.json();

            if (!data.success)
                throw (Error(data.message));
            console.log(data);
            this.histo = data.histo;
        } catch (error){
            console.log(error);
        }
    }


	//VIEW
	printHisto(){

	}

    async	printPage(){
        if (this.profile_username === null){
            this.profile_username = this.username;
            await this.searchPlayerHandler();
        }

        //profile
        this.profile_page.classList.replace("hidden", "flex");
        this.profile_username_tag.innerText = this.profile_username;
        (this.profile_picture as HTMLImageElement).src = this.picture_path + "?" + new Date().getTime(); // jsp ??
        this.register_date_tag.innerText = `${this.site.getText("member_since")}: ${this.register_date}`;

		if (this.profile_username != this.username){
			this.friend_div.classList.replace("hidden", "flex");
			this.fa_btn.classList.replace("flex", "hidden");
		}
		else{
			this.friend_div.classList.replace("flex", "hidden");
			this.fa_btn.classList.replace("hidden", "flex");
		}

        //historic
		this.printHisto();
    }

    hide_page(){
        this.profile_page.classList.replace("flex", "hidden");
    }

    hide_all(){
        this.hide_page();
    }
};

export class SiteController{

    //Controller attributes
    private lang_file = null;
    private isRegisterMode = false;
    private ws : ClientSocket = null;
    private username : string;

    private game : GameController = null;
    private tournament : TournamentController = null;
    private profile: ProfileController = null;
    private lang: LangController = null;
    private friends: FriendController = null;

    //  View attributes
    private title_link = document.getElementById("game_title");
    private register_link = document.getElementById("register-view");
    private login_form = document.getElementById("form");
    private main_page = document.getElementById("site");
    private menu = document.getElementById("menu");
    private about = document.getElementById("about");
    
    //  Buttons
    private online_play_btn = document.getElementById("matchmaking");
    private offline_play_btn = document.getElementById("offline");
    private profile_btn = document.getElementById("profile_button");
    private tournament_btn = document.getElementById("tournament_button");
    private tournament_create_btn = document.getElementById("tournament_create_button");
    private tournament_join_btn = document.getElementById("tournament_join_button");
    private about_btn = document.getElementById("about_button");
    private logout_btn = document.getElementById("logout_btn");

    constructor(){
        this.profile = new ProfileController(this);
        this.game = new GameController(this);
        this.tournament = new TournamentController(this);
    }

    async initLang() {
        if (await this.is_logged())
            this.connect();

        this.lang = new LangController(this.username);
        this.friends = new FriendController(this.username, this.lang, this.ws);
        this.print_current_page();
    }

    getLang(){
        return this.lang_file;
    }

    getText(key: string){
        return this.lang_file[key];
    }

    /**
     * CONTROLLER
     */
    add_events(){
        // Register/login page
        this.register_link.addEventListener("click", (event) => {
            event.preventDefault();

            const formTitle = document.getElementById("form-title");
            const registerLink = document.getElementById("register-view"); //link for swapping register/login
            const logginBtn = document.getElementById("login_btn");

            this.isRegisterMode = !this.isRegisterMode;
            if (this.isRegisterMode) {
                formTitle.textContent = this.lang_file["register_title"];
                registerLink.textContent = this.lang_file["connexion_text"];
                logginBtn.textContent = this.lang_file["register_title"];
    
            } else {
                formTitle.textContent = this.lang_file["connexion_title"];
                registerLink.textContent = this.lang_file["register_text"];
                logginBtn.textContent = this.lang_file["connexion_title"];
            }
        });

        // Register/login form validation
        this.login_form.addEventListener("submit", async (event) => {
            event.preventDefault();
            
            const username = document.getElementById("username") as HTMLInputElement;
            const password = document.getElementById("password") as HTMLInputElement;
            
            const url = this.isRegisterMode ? "/register" : "/login";
            const body = { 
                username: username.value,
                password: password.value,
            };

            // console.log(`Envoi vers ${url}`, body);
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                
                // console.log(response);
                const data = await response.json();
                // console.log("Réponse du serveur :", data);
                
                if (data.success) {
                    this.username = data.username;
                    this.connect();
                    // this.ws.print_info();

                } else {
                    const error = document.getElementById("errorAuth") as HTMLParagraphElement;
                    error.textContent = this.lang_file[data.message];
                    error.classList.replace("hidden", "block");
                    console.log("Auth error");
                }
            } catch (error) {
                console.error("error ", error);
                alert("Une erreur est survenue.");
            }
        });

        // Menu link
        this.title_link.addEventListener("click", async (event) => {
            event.preventDefault();

            this.hide_all();
            this.print_menu();
            this.print_btn_menu();
        });

        // Show about page
        this.about_btn.addEventListener("click", async (event) => {
            event.preventDefault();

            this.hide_menu();
            this.print_about_page();
        });

        // Profile display
        this.profile_btn.addEventListener("click", async (event) => {
            this.hide_menu();
            this.profile.printPage();
        });

        // Tournament menu
        this.tournament_btn.addEventListener("click", async(event) => {
            event.preventDefault();
            this.hide_btn_menu();
            this.print_tournament_btns();
        });


        this.logout_btn.addEventListener("click", async (event) => {
            event.preventDefault();

            const response = await fetch("/logout", {
                method: "POST",
            });
            sessionStorage.clear();
            
            document.getElementById("site").classList.replace("block", "hidden");
            document.getElementById("login-form").classList.replace("hidden", "flex");
            document.body.classList.add("justify-center", "align-center", "flex");
        });

		//Registering children events
        this.game.addEvents();
        this.profile.addEvents();
        this.tournament.addEvents();
        this.lang.addEvents();
    }

    async is_logged(){
        try {
            const response = await fetch('/protected', {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            this.username = data.username
            return (response.ok === true && data.success === true);
        } catch (error) {
            return (false);
        }
    }
    
    store_session(username){
        sessionStorage.setItem('username', username);
    }

    connect(){
        this.ws = new ClientSocket(this.username, this, this.profile);
        this.game.setUsername(this.username);
        this.profile.setUsername(this.username);
        this.tournament.setUsername(this.username);
        this.store_session(this.username);

        console.log("Connected, client socket :");
        console.log(this.ws);

        this.hide_register_page();
        document.body.classList.remove("justify-center", "align-center", "flex");
        this.print_main_page();
    }

    /**
     * VIEW PART
     */

    print_register_page(){
        document.getElementById("login-form").classList.replace("hidden", "block");
    }

    hide_register_page(){
        document.getElementById("login-form").classList.replace("block", "hidden");
    }

    print_main_page(){
        this.main_page.classList.replace("hidden", "block");
    }

    hide_main_page(){
        this.main_page.classList.replace("hidden", "block");
    }

    print_menu(){
        this.print_main_page();
        this.menu.classList.replace("hidden", "block");
    }

    hide_menu(){
        this.menu.classList.replace("block", "hidden");
    }

    print_about_page(){
        this.about.classList.replace("hidden", "flex");
    }
    
    hide_about_page(){
        this.about.classList.replace("flex", "hidden");
    }

    // GET et afficher les infos du profile / historique
// async function display_profile(username) {
//     const list =  as HTMLUListElement;
//     try {
//         // requete des infos pour afficher le profile
//         const profile_req = await fetch(`/profile/${username}`, {
//             method: 'GET',
//             credentials: 'include',
//             headers: { "Content-Type": "application/json" },
//         });

//         const profile = await profile_req.json();
//         if (!profile.datas) {
//             console.log("player not found.");
//             return ;
//         }
/******************************************* */
//         const friendDiv = document.getElementById("friend_div");
//         const faBtn = document.getElementById("fa_btn");
//         if (profile.datas.username == _username) {
//             friendDiv.classList.replace("flex", "hidden");
//             faBtn.classList.replace("hidden", "relative");
//         }
//         else {
//             const responseFriends = await fetch(`/db/friends/${_username}/${username}`, {
//                 method: 'GET',
//                 credentials: 'include',
//                 headers: { "Content-Type": "application/json" },
//             });

//             const friends = await responseFriends.json();

//             if (!friends.success)
//                 console.log("error: ", friends.error);
//             else {
//                 console.log(friends);
//                 document.getElementById("friend_btn").textContent = lang_file[friends.message];
//                 document.getElementById("block_btn").textContent = friends.emoji;
//             }

//             console.log(friends.message);
//             friendDiv.classList.replace("hidden", "flex");
//             faBtn.classList.replace("relative", "hidden");
//         }

//         // requete des games
//         const histo_req = await fetch(`/historic/${username}`, {
//             method: 'GET',
//             credentials: 'include',
//             headers: { "Content-Type": "application/json" },
//         });
//         const data = await histo_req.json();
//         console.log(data);
//         list.replaceChildren();

//         // affiche l'historique
//         if (data.success) {
//             var cpt = 0;
//             var w = 0;
//             data.histo.forEach((item) => {
//                 cpt++;
//                 if (cpt < 6) {
//                     let li = document.createElement("li");
//                     let a = document.createElement("a");
//                     a.innerText = item.winner_username;
//                     a.classList.add("text-green-500", "underline");
//                     a.href="#";
//                     a.id="profileDisplay";

//                     let a2 = document.createElement("a");
//                     a2.innerText = item.loser_username;
//                     a2.classList.add("text-green-500", "underline");
//                     a2.href="#";
//                     a2.id="profileDisplay";

//                     li.appendChild(a);
//                     li.innerHTML += ": 11 VS ";
//                     li.appendChild(a2);
//                     li.innerHTML += " : " + item.loser_score + " at " + item.created_at;
            
//                     list.appendChild(li);
//                     li.style.fontSize = "16px";
//                 }
//                 if (item.winner_username == profile.datas.username)
//                     w++;
//                 document.getElementById("wr_card").textContent = `${lang_file["wr"]} : ${(w / cpt * 100).toFixed(0)}%`;
//             });
//             if (cpt == 0)
//                 document.getElementById("wr_card").textContent = `${lang_file["wr"]} : N/a`;
//         }
//         // change les a (lien) de l'historique par des liens qui menent a la page de profile
//         document.querySelectorAll("a#profileDisplay").forEach((item) => { 
//             item.addEventListener("click", async (event) => {
//                     event.preventDefault();
//                     await display_profile(item.textContent);
//                 });
//         });
//         if (cpt > 0) {
//             document.getElementById("wr").textContent = `${w} / ${cpt}` ;
//             let wr = w/(cpt)*100;
//             document.getElementById("percent").setAttribute("stroke-dasharray", `${wr}, 100`);
//         } else {
//             document.getElementById("wr").textContent = "N/A" ;
//             document.getElementById("percent").setAttribute("stroke-dasharray", `50, 100`);
//             document.getElementById("histo").classList.replace("hidden", "block");
//         }
//         document.getElementById("histo").classList.replace("hidden", "block");
//     } catch (error) {
//         console.log("error fetching db: ", error);
//     }
// }
    print_tournament_btns(){
        this.tournament_create_btn.classList.replace("hidden", "flex");
        this.tournament_join_btn.classList.replace("hidden", "flex");
    }

    hide_tournament_btns(){
        this.tournament_create_btn.classList.replace("flex", "hidden");
        this.tournament_join_btn.classList.replace("flex", "hidden");
    }

    print_error_page(){
        console.log("error");
    }

    hide_all(){
        this.hide_register_page();
        this.hide_main_page();
        this.hide_menu();
        this.hide_about_page();
        this.hide_tournament_btns();
        this.game.hide_all();
        this.profile.hide_all();
        this.tournament.hide_all();
    }

    print_btn_menu(){
        this.online_play_btn.classList.replace("hidden", "flex");
        this.offline_play_btn.classList.replace("hidden", "flex");
        this.profile_btn.classList.replace("hidden", "flex");
        this.tournament_btn.classList.replace("hidden", "flex");
        this.about_btn.classList.replace("hidden", "flex");
    }

    hide_btn_menu(){
        this.online_play_btn.classList.replace("flex", "hidden");
        this.offline_play_btn.classList.replace("flex", "hidden");
        this.profile_btn.classList.replace("flex", "hidden");
        this.tournament_btn.classList.replace("flex", "hidden");
        this.hide_tournament_btns();
        this.about_btn.classList.replace("flex", "hidden");
    }

    print_current_page(){
        if (this.ws != null)
            this.print_menu();
        else
            this.print_register_page();
    }
};
