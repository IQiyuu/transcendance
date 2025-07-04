// import {Game} from "./pong.js";

import { FriendController } from "./FriendController.js";

/**
 * Class used for connected client
 */
export class ClientSocket{
    private ws : WebSocket = null;
    private username : string;
    private user_id : number = -1;
    private view_site;
    private view_profile;

    private friends: FriendController = null;

    // protected game : Game = null;

    // constructor(username, view_site, view_profile, view_friends){
    constructor(username){
        this.username = username;
        this.ws = new WebSocket(`wss://${window.location.host}/ws?username=${this.username}`);
    }

    get_username(){
        return (this.username);
    }

    async setFriend(friend: FriendController, view_site, view_profile) {
        await this.set_socket();
        this.view_site = view_site;
        this.view_profile = view_profile;
        this.friends = friend;
    }

    async set_socket(){
        this.ws.onopen = (event) => {
            console.log("Auth connected");
            this.friends.initFriendlist();
        }
        
        this.ws.onmessage = (message) => {
            console.log("msg recu: ", message);
            const data = JSON.parse(message.data);
            if (data === null)
                return ; 
            if (data.type == "connection") {
                const div = document.getElementById(`${data.user}_friendlist`);
                const dot = div.getElementsByTagName("span")[0];
                dot.classList.replace("bg-red-500", "bg-green-500");
            } else if (data.type == "disconnection") {
                const div = document.getElementById(`${data.user}_friendlist`);
                const dot = div.getElementsByTagName("span")[0];
                dot.classList.replace("bg-green-500", "bg-red-500");
            } else if (data.type == "addFriend") {
                this.friends.addFriend(data.user, data.pp);
                document.getElementById("friend_btn").textContent = this.view_site.getText("rem_friend");
            } else if (data.type == "removeFriend") {
                this.friends.removeFriend(data.user);
                document.getElementById("friend_btn").textContent = this.view_site.getText("add_friend");
            } else if (data.type == "pseudo_swap") {
                document.getElementById(`${data.username}_friendlist`).id = `${data.newUsername}_friendlist`;
                document.getElementById(`${data.username}_friendlist`).textContent = data.newUsername;
            }
        };
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

    say_ready(){
        this.ws.send(JSON.stringify({
            type : "game_start"
        }));
    }

    print_info(){
        console.log("Websocket for : " + this.username);
    }

    close(){
        this.ws.close();
    }

    send(msg: string) {
        this.ws.send(msg);
    }
};
