import {ClientSocket} from "./ClientSocket.js";
import {Game} from "./pong.js";
import {Tournament} from "./Tournament.js";

export class SiteView{

    //Controler attributes
    private lang_file = null;
    private isRegisterMode = false;
    private cws : ClientSocket = null;

    private game : Game = null;
    private tournament : Tournament = null;
    private is_searching : boolean = false;

    //View attributes
    private register_link;
    private login_form
    private main_page;
    private menu;
    private profile_page;
    private play_page;
    private tournament_page;
    private about;
    
    //      Buttons
    private profile_btn;
    private online_play_btn;
    private offline_play_btn;
    private tournament_btn;
    private tournament_create_btn;
    private tournament_join_btn;
    private about_btn;
    
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
        this.play_page = document.getElementById("game_page");
        this.tournament_page = document.getElementById("tournament_page");
        this.about = document.getElementById("about");

        this.online_play_btn = document.getElementById("matchmaking");
        this.offline_play_btn = document.getElementById("offline");
        this.profile_btn = document.getElementById("profile_button");
        this.tournament_btn = document.getElementById("tournament_button");
        this.tournament_create_btn = document.getElementById("tournament_create_button");
        this.tournament_join_btn = document.getElementById("tournament_join_button");
        this.about_btn = document.getElementById("about_button");

        this.tournament = new Tournament(this, this.cws);
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
            this.print_btn_menu();
        });

        // Show about page
        this.about_btn.addEventListener("click", async (event) => {
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

        //Online playing
        this.online_play_btn.addEventListener("click", (event) => {
            event.preventDefault();

            if (this.is_searching){
                this.stop_matchmaking();
            } else{
                this.start_matchmaking();
            }
            this.is_searching = !this.is_searching;
        });

        //Local play
        this.offline_play_btn.addEventListener("click", async (event) => {
            event.preventDefault();

            this.hide_menu();
            this.print_play_page();

            try {
                const body = {
                    username: this.cws.get_username(),
                }
                const resp = await fetch(`/game/local/create`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                const data = await resp.json();
                if (data.success) {
                    // startGame(null, this._ws, true);
                    this.game = new Game(this.cws, data.id, null, this.cws.get_username().concat("-2"), true);
                    this.cws.set_game(this.game);
                    // this.game.start();
                }
            } catch (error) {
                console.log("error: ", error);
            }
        });

        // Profile display
        this.profile_btn.addEventListener("click", async (event) => {
            this.hide_menu();
            //Set dynamiquement here
            // ...
            this.print_profile_page();
        });

        //Tournament menu
        this.tournament_btn.addEventListener("click", async(event) => {
            event.preventDefault();
            this.hide_btn_menu();
            this.print_tournament_btns();
        });

        this.tournament.addEvents();
    }
    
    start_matchmaking(){
        this.start_matchmaking_animation();
        this.cws.start_matchmaking();
    }

    stop_matchmaking(){
        this.stop_matchmaking_animation();
        this.cws.stop_matchmaking();
    }

    // check if we have username and cookie auth
    async is_logged(){
        if (sessionStorage != null && sessionStorage.getItem("username") === null)
            return (false);
        try {
            const response = await fetch('/protected', {
                method: 'GET',
                credentials: 'include'
            });
    
            const data = await response.json();

            return (response.ok === true && data.success === true);
        } catch (error) {
            return (false);
        }
    }
    
    store_session(username){
        sessionStorage.setItem('username', username);
    }

    connect(username){
        this.cws = new ClientSocket(username, this);
        this.store_session(username);
        this.tournament.setSocket(this.cws);
        this.hide_register_page();
        document.body.classList.remove("justify-center", "align-center", "flex");
        this.print_main_page();
    }

    // Creating a game for online players
    createGame(gameId, role, opponent){
        console.log("Match with ", opponent);
        this.game = new Game(this.cws, gameId, role, opponent, false);
        // this.game.start();
        return (this.game);
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

    print_play_page(){
        this.play_page.classList.replace("hidden", "block");
    }

    hide_play_page(){
        this.play_page.classList.replace("block", "hidden");
    }

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
        this.hide_play_page();
        this.hide_profile_page();
        this.hide_tournament_btns();
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
        if (this.cws != null)
            this.print_menu();
        else
            this.print_register_page();
    }
};
