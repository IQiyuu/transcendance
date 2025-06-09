// import {Game} from "./pong.js";

/**
 * Class used for connected client
 */
export class ClientSocket{
    private ws : WebSocket = null;
    private username : string;
    private user_id : number = -1;
    private view_site;
    private view_profile;

    // protected game : Game = null;

    // constructor(username, view_site, view_profile, view_friends){
    constructor(username, view_site, view_profile){
        this.username = username;
        this.ws = new WebSocket(`wss://${window.location.host}/ws?username=${this.username}`);
        this.set_socket();
        this.view_site = view_site;
        this.view_profile = view_profile;
    }

    get_username(){
        return (this.username);
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

    set_socket(){
        this.ws.onopen = (event) => {
            console.log("Auth connected");
            // this.view_profile.updateProfile();
        }
        
        this.ws.onmessage = (message) => {
            console.log("msg recu");
            const data = JSON.parse(message.data);
            if (data === null)
                return ; // ERROR
            // console.log("You got a mail, ", data.type);
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
            }
        };

        this.ws.onclose = (event) => {
            // console.log("Closing client " + this.username);
            // Maybe we neeed to say bye to the server ?
        }

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

    // Tell the server game is ready to start
    say_ready(){
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
