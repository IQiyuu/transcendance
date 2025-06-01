export class SiteView{
    private lang_file;
    private isRegisterMode = false;
    private current_page; // ??
    private register_link;
    private login_form;

    private cws;
    private user_id;

    
    constructor(lang){
        this._load_lang(lang);
        this.lang_file = lang;
        this.register_link = document.getElementById("register-view");
        this.login_form = document.getElementById("form");
    }
    
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
        this.register_link.addEventListener("click", (event) => {
            event.preventDefault();
            console.log("CLICKING");

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
        
        this.login_form.addEventListener("submit", async (event) => {
            event.preventDefault();
            
            const username = document.getElementById("username") as HTMLInputElement;
            const password = document.getElementById("password") as HTMLInputElement;
            
            const url = this.isRegisterMode ? "/register" : "/login";
            const body = { 
                username: username.value, 
                password: password.value,
            };

            console.log(`Envoi vers ${url}`, body);
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                
                console.log(response);
                const data = await response.json();
                console.log("Réponse du serveur :", data);
                
                if (data.success) {
                    this.cws = new ClientSocket(data.username, this);
                    this.cws.print_info();

                    sessionStorage.setItem('username', data.username);
                    sessionStorage.setItem('userId', data.id);
                    this.user_id = data.id;

                    this.hide_register_page();
                    document.body.classList.remove("justify-center", "align-center", "flex");
                    this.print_main_page();

                    // const loginForm = document.getElementById("login-form") as HTMLDivElement;
                    // const pongGame = document.getElementById("site") as HTMLDivElement;
                    // loginForm.classList.replace("flex", "hidden");
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

        document.addEventListener("DOMContentLoaded", () => {
                const formTitle = document.getElementById("form-title");
                const registerLink = document.getElementById("register-view"); //link for swapping register/login
                const logginBtn = document.getElementById("login_btn");
            
                console.log("LOADING DOM");
                // swap entre connexion et inscription
            
                // formulaire de connexion / inscription
            });
    }

    print_register_page(){
        document.getElementById("login-form").classList.replace("hidden", "block");
    }

    hide_register_page(){
        document.getElementById("login-form").classList.replace("block", "hidden");
    }

    print_main_page(){
        document.getElementById("site").classList.replace("hidden", "block");
    }

    print_error_page(){
        console.log("error");
    }

    print_page(){
        this.print_register_page();
    }
};

/**
 * Class used for connected client
 */
export class ClientSocket{
    private _ws : WebSocket;
    private username : string;
    private view;

    // protected _game : Game = null;

    constructor(username, view){

        this.username = username;
        this._ws = new WebSocket(`wss://${window.location.host}/ws?username=${this.username}`);
        if (this._ws == null)
            throw (Error("Cannot initialize the web socket"));
        
        this._setSocket();
        this.view = view;
    }

    async isLoggedIn() {
        try {
            const response = await fetch('/protected', {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok && data.success) {
                sessionStorage.setItem('username', data.username);
                sessionStorage.setItem('userId', data.id);
                this.username = data.username;
                console.log('Utilisateur connecté:', data.username);
                // init();
                return true;
            }
            console.log('Utilisateur non connecté');
            return false;
        } catch (error) {
            console.error('Erreur lors de la vérification de la connexion:', error);
            return false;
        }
    }

    _setSocket(){
        this._ws.onopen = (event) => {
            console.log("Auth connected");
            // Maybe a check to see if we still exists for the server (like if make re)?
            // this.isLoggedIn().then(this.view.print_page, this.view.print_error_page);
            // if (!this.isLoggedIn()){
            //     console.log("Not logged");
            //     this.view.print_register_page();
            // }
            // else{
            //     console.log("Already logged");
            // }
        }
        
        this._ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data == null)
                return ; // ERROR
            console.log("You got a mail, ", data.user);
            // appendMessage(message);
            if (data.type == "connection") {
                const div = document.getElementById(`${data.user}_friendlist`);
                const dot = div.getElementsByTagName("span")[0];
                dot.classList.replace("bg-red-500", "bg-green-500");
                console.log(dot.classList[4]);
                console.log(div);
                console.log(dot);
            } else if (data.type == "disconnection") {
                const div = document.getElementById(`${data.user}_friendlist`);
                const dot = div.getElementsByTagName("span")[0];
                dot.classList.replace("bg-green-500", "bg-red-500");
            } else if (data.type == "addFriend") {
                // addFriend(data.user, data.pp);
            } else if (data.type == "removeFriend") {
                // removeFriend(data.user);
            } else if (data.type == "matchmaking") {
                if (data.state == "found") {
                    // stopMatchmakingAnimation();
                    // this._role = data.role;
                    // this._gameId = data.gameId;
                    // console.log("game starting ", this._gameId);
                    // startGame(data.opponent, this._ws, false);
                }
            }
        };

        this._ws.onclose = (event) => {
            console.log("Closing client " + this.username);
            // Maybe we neeed to say bye to the server ?
        }

        // if (this._ws && this._ws.readyState === WebSocket.CLOSING) {
        //     _ws.close(JSON.stringify({
        //         gameId:_gameId,
        //         mod: _mod,
        //         uname: _username}));
        // }
    }
    
    print_info(){
        console.log("Websocker for : " + this.username);
    }

    close(){
        this._ws.close();
    }
};
