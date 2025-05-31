
export class ClientSocket{
    private _ws : WebSocket;
    readonly username : string;

    // protected _game : Game = null;

    constructor(username, lang){

        this.username = username;
        this._ws = new WebSocket(`wss://${window.location.host}/ws?username=${this.username}`);
        this._load_lang(lang);
        
        // this.print_info();

        this._setSocket();
        
        
        console.log("Client socket initialised");
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
    
    _setSocket(){
        this._ws.onopen = (event) => {
            console.log("Connected");
            // Maybe a check to see if we still exists for the server (like if make re)?
        }

        this._ws.addEventListener("open", event => {
            console.log("Connected to WS server!");
        }); // Useless ?
        
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
        console.log("Username : " + this._ws);
    }

    close(){
        this._ws.close();
    }
};
