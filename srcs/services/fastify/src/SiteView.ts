import {ClientSocket} from "./ClientSocket.js";

export class SiteView{

    //Controler attributes
    private lang_file = null;
    private isRegisterMode = false;
    private cws : ClientSocket = null;

    private is_searching : boolean = false;

    //View attributes
    private register_link;
    private login_form
    private main_page;
    private menu;
    private profile_page;
    private about;
    
    //      Buttons
    private profile_btn;
    private online_play_btn;
    
    //      Interval for timings
    private interval_id;
    
    constructor(lang){
        this.lang_file = lang;
        this._load_lang(lang);
        this.register_link = document.getElementById("register-view");
        this.login_form = document.getElementById("form");
        this.main_page = document.getElementById("site");
        this.menu = document.getElementById("menu");
        this.profile_page = document.getElementById("player_profile");
        this.about = document.getElementById("about");

        this.online_play_btn = document.getElementById("matchmaking");
        this.profile_btn = document.getElementById("profile_button");
    }

    // Controller part

    _load_lang(lang){
        document.getElementById('form-title').textContent = lang['connexion_title'];
        document.querySelector("label[for='username']").textContent = lang['username'];
        document.querySelector("label[for='password']").textContent = lang['password'];
        document.getElementById('register-view').textContent = lang['register_text'];
        document.getElementById('game_title').textContent = lang['title'];
        document.getElementById('div_title').textContent = lang['change_pp'];
        document.getElementById('login_btn').textContent = lang['connexion_title'];
        document.getElementById('offline').textContent = lang['play_local'];
        document.getElementById('matchmaking').textContent = lang['play_online'];
        document.getElementById('tournament_button').textContent = lang['tournament'];
        document.getElementById('profile_button').textContent = lang['profile'];
        document.getElementById('upload_btn').textContent = lang['upload_txt'];
        document.getElementById('about_button').textContent = lang['about'];
        document.getElementById('friend_text').textContent = lang['friends'];
        document.getElementById('histo_text').textContent = lang['historique'];
        (document.getElementById('search_player_in') as HTMLInputElement).placeholder = lang['search'];
    }

    addEvents(){
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
                    this.connect(data.username);
                    // this.cws.print_info();

                    // const pongGame = document.getElementById("site") as HTMLDivElement;
                    // pongGame.classList.replace("hidden", "block");

                    // fillCanvas();// ?
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
        document.getElementById("game_title").addEventListener("click", async (event) => {
            event.preventDefault();

            this.hide_all();
            this.print_menu();
        });

        // Show about page
        document.getElementById("about_button").addEventListener("click", async (event) => {
            event.preventDefault();

            this.hide_menu();
            this.print_about_page();
        });

        // dont know what it did
        document.addEventListener("DOMContentLoaded", () => {
            const formTitle = document.getElementById("form-title");
            const registerLink = document.getElementById("register-view"); //link for swapping register/login
            const logginBtn = document.getElementById("login_btn");
            
            console.log("LOADING DOM");
        });

        //Matchmaking
        this.online_play_btn.addEventListener("click", () => {
            if (this.is_searching){
                this.stop_matchmaking();
            } else{
                this.start_matchmaking();
            }
            this.is_searching = !this.is_searching;
        });

        // // afficher le profile
        this.profile_btn.addEventListener("click", async (event) => {
            this.hide_menu();
            //Set dynamiquemnt here
            // ...
            this.print_profile_page();
        });
    }
    
    start_matchmaking(){
        this.start_matchmaking_animation();
    }

    stop_matchmaking(){
        this.stop_matchmaking_animation();
    }

    // check if we have username and cookie auth
    async is_logged(){
        if (localStorage != null && localStorage.getItem("username") === null)
            return (false);
        try {
            console.log("fetching protected");
            const response = await fetch('/protected', {
                method: 'GET',
                credentials: 'include'
            });
            console.log("response is" + response);
    
            const data = await response.json();
            console.log("data is" + data);
            console.log("1 " + response.ok + " 2 " + data.success);

            return (response.ok === true && data.success === true);
        } catch (error) {
            return (false);
        }
    }
    
    store_session(username){
        localStorage.setItem('username', username);
    }

    connect(username){
        this.cws = new ClientSocket(username, this);
        this.store_session(username);

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

    // anim_matchmaking_handler(count){
    //     count++;
    //     this.online_play_btn.textContent = this.lang_file['waiting'] + '.'.repeat(count % 3);
    // }

    // Animation du boutton
    start_matchmaking_animation(){
        let count = 0;

        // good luck ! (waiting is not the locales version of website, try changing language to see)
        // maybe by getting current value then adding in the handler ?
        this.interval_id = window.setInterval(() => {
            count++;
            document.getElementById("matchmaking").textContent = "waiting" + '.'.repeat(count % 3);
        }, 500);
        // this.interval_id = setInterval(() => {
        //     btn.textContent = waiting + '.'.repeat(count % 3);
        // }, 500);
    }

    stop_matchmaking_animation(){
        clearInterval(this.interval_id);
        this.online_play_btn.textContent = this.lang_file['play_online'];
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

    print_profile_page(){
        this.profile_page.classList.replace("hidden", "flex");
    }

    hide_profile_page(){
        this.profile_page.classList.replace("flex", "hidden");
    }

    print_error_page(){
        console.log("error");
    }

    hide_all(){
        this.hide_register_page();
        this.hide_main_page();
        this.hide_menu();
        this.hide_about_page();
        this.hide_profile_page();
    }

    print_current_page(){
        if (this.cws != null)
            this.print_menu();
        else
            this.print_register_page();
    }
};
