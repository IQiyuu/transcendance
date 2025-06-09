import {GameController} from "./pong.js";

/**
 * Class used for connected client
 */
export class GameClientSocket{
    private ws : WebSocket = null;
    private username : string;
    private view;

    protected game : GameController = null;

    constructor(username, game){
        this.username = username;
        this.ws = new WebSocket(`wss://${window.location.host}/game/ws/?username=${this.username}`);
        this.game = game;
        this.setSocket();
    }

    get_username(){
        return (this.username);
    }

    // set_game(g : GameController){
    //     this.game = g;
    // }

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

    setSocket(){
        this.ws.onopen = (event) => {
            console.log("Auth connected");
        }
        
        this.ws.onmessage = (message) => {
            console.log("msg recu");
            const data = JSON.parse(message.data);
            if (data === null)
                return ;

            if (data.type === "game_info"){
                // if valid
                // ...
                this.game.updateState(data.game);
            } else if (data.type === "matchmaking") {
                if (data.state === "found") {
                    this.game.stop_matchmaking_animation();
                    this.game.hide_all();
                    this.game.print_play_page();
                }
            }else if (data.type === "offlineGameCreated"){
                this.game.hide_all();
                this.game.print_play_page();
        
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
    
    startMatchmaking(){
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            uname: this.username,
            state: "enter"
        }));
    }

    stopMatchmaking(){
        this.ws.send(JSON.stringify({
            type: "matchmaking",
            state: "left"
        }));
    }

    startOfflineGame(){
        this.ws.send(
            JSON.stringify({ // A revoir
                type: "solo",
                state: "create"
            })
        );
    }

    // Tell the server game is ready to start
    sayReady(){
        this.ws.send(JSON.stringify({
            type : "game_start"
        }));
    }

    // Update the server with movements
    updatePos(game_id, key, side){
        console.log("Sending " +  game_id + key + side);
        this.ws.send(JSON.stringify({
            type : "game_update",
            game_id : game_id,
            moveUp : key,
            side : side
        }));
    }

    print_info(){
        console.log("Websocket for : " + this.username);
    }

    close(){
        this.ws.close();
    }
};
