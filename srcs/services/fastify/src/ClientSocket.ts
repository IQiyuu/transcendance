/**
 * Class used for connected client
 */
export class ClientSocket{
    private ws : WebSocket = null;
    private username : string;
    private user_id : number = -1;
    private view;

    // protected _game : Game = null;

    constructor(username, view){
        this.username = username;
        this.ws = new WebSocket(`wss://${window.location.host}/ws?username=${this.username}`);
        this._setSocket();
        this.view = view;
    }

    // async isLoggedIn() { // maybe useless, as I copied it to controller
    //     try {
    //         const response = await fetch('/protected', {
    //             method: 'GET',
    //             credentials: 'include',
    //         });

    //         const data = await response.json();

    //         if (response.ok && data.success) {
    //             sessionStorage.setItem('username', data.username);
    //             sessionStorage.setItem('userId', data.id);
    //             this.username = data.username;
    //             console.log('Utilisateur connecté:', data.username);
    //             return (true);
    //         }
    //         console.log('Utilisateur non connecté');
    //         return (false);
    //     } catch (error) {
    //         console.error('Erreur lors de la vérification de la connexion:', error);
    //         return (false);
    //     }
    // }

    _setSocket(){
        this.ws.onopen = (event) => {
            console.log("Auth connected");
        }
        
        this.ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data)
                return ; // ERROR
            console.log("You got a mail, ", data.user);
            // appendMessage(message);
            if (data.type == "connection") {
                // this.view.friend_connect();
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
                    this.view.stop_matchmaking_animation();
                    this.view.createGame(data.gameId, data.role, data.opponent);
                    // this._role = data.role;
                    // this._gameId = data.gameId;
                    // console.log("game starting ", this._gameId);
                    // startGame(data.opponent, this._ws, false);
                }
            }
        };

        this.ws.onclose = (event) => {
            // console.log("Closing client " + this.username);
            // Maybe we neeed to say bye to the server ?
        }

        // if (this._ws && this._ws.readyState === WebSocket.CLOSING) {
        //     _ws.close(JSON.stringify({
        //         gameId:_gameId,
        //         mod: _mod,
        //         uname: _username}));
        // }
    }
    
    start_matchmaking(){
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            uname: this.username,
            state: "enter"
        }));
    }

    stop_matchmaking(){
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            state: "left"
        }));
    }

    print_info(){
        console.log("Websocket for : " + this.username);
    }

    close(){
        this.ws.close();
    }
};
