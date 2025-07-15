import { ClientSocket } from "./ClientSocket.js";
import { LangController } from "./LangContoller.js";

export class FriendController {

    private friendlist = document.getElementById("friendlist");
    private friend_btn = document.getElementById("friend_btn");
    private block_btn = document.getElementById("block_btn");

    private username: string = null;

    private lang: LangController = null;
    private ws: ClientSocket = null;

    constructor(username: string, lang: LangController, ws: ClientSocket) {
        this.username = username;
        this.lang = lang;
        this.ws = ws;

        this.handleFriendClick = this.handleFriendClick.bind(this);
        this.handleBlockClick = this.handleBlockClick.bind(this);

        this.addEvents();
    }

    setUsername(username: string) { this.username = username; }
    setLang(lang: LangController) { this.lang = lang; }

    async initFriendlist() {
        this.friendlist.innerHTML = "";
        try {
            const response = await fetch(`/db/friends/friendlist/${this.username}`, {
                method: "GET",
            });

            const data = await response.json();
            if (!data.success) {
                throw(Error(data.error));
            } else {
                for (let user of data.friends) {
                    // console.log(user);
                    this.addFriend(user.username, user.pp);
                    this.ws.send(JSON.stringify({
                        type: "connection",
                        user: this.username,
                        target: user,
                    }));
                }
            }
            this.ws.send(JSON.stringify({
                type: "initialized",
                user: this.username
            }));
        } catch (error) {
            alert(error.message);
        }
    }

    removeFriend(username: string) {
        const divs = this.friendlist.querySelectorAll("div");

        divs.forEach((div) => {
            if (div.id == `${username}_friendlist`) {
                this.friendlist.removeChild(div);
                return ;
            }
        });
    }

    addFriend(username: string, pp: string) {
        const div = document.createElement("div");
        const img = document.createElement("img");
        const span = document.createElement("span");
        const p = document.createElement("p");
        div.className = "w-full flex items-center justify-between p-3 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer";
        div.id = username+"_friendlist";

        img.src = "assets/imgs/" + pp;
        img.className = "rounded-full";
        img.style.width = "7%";

        span.className = "flex w-3 h-3 me-3 bg-green-500 rounded-full";

        p.className = 'text-lg';
        p.textContent = username.length > 10 ? username.substring(0,8)+"..":username;
                    
        div.appendChild(img);
        div.appendChild(span);
        div.appendChild(p);

        this.friendlist.appendChild(div);
    }

    async handleFriendClick(event: Event) {
        const friend_uname = document.getElementById("profile_username").textContent;
        const body = {
            username: this.username,
            friend: friend_uname,
        }

        // console.log("body: ", body);
        try {
            const friend_req = await fetch(`/db/friends/update`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await friend_req.json();
            if (data.success) {
                document.getElementById("friend_btn").textContent = this.lang.getFile()[data.message];
                if (data.status == "accepted") {
                    try {
                        const friend = data.friend;
                        const me = data.user;
                        this.addFriend(friend.username, friend.pp);
                        this.ws.send(JSON.stringify({
                            type: "addFriend",
                            user: me.username,
                            pp: me.pp,
                            target: friend.username,
                        }));
                    } catch (error) {
                        alert(error);
                    }
                } else if (data.status == null) {
                    this.removeFriend(friend_uname)
                    this.ws.send(JSON.stringify({
                        type: "removeFriend",
                        user: this.username,
                        target: friend_uname,
                    }));
                }
            }
            else
                alert(data.error);
        } catch (error) {
            alert(error);
        }
    }

    async handleBlockClick(event: Event) {
        const toBlock = document.getElementById("profile_username").textContent;
        const body = {
            username: this.username,
            friend: toBlock,
        }

        const friend_req = await fetch(`/db/friends/block`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await friend_req.json();
        if (data.success) {
            this.block_btn.textContent = data.blocking ? "🔓" : "🔒";
            this.friend_btn.textContent = 
                data.blocking ? this.lang.getFile()["send_yblock"] : this.lang.getFile()["send_inv"];
            if (data.blocking) {
                this.ws.send(JSON.stringify({
                    type: "removeFriend",
                    user: this.username,
                    target: toBlock,
                }));
                this.removeFriend(toBlock);
            }
        }
        else
            console.log("error: ", data.error);
    }

    addEvents() {
        this.friend_btn.addEventListener("click", this.handleFriendClick);
        this.block_btn.addEventListener("click", this.handleBlockClick);
    }

    removeEvents() {
        this.friend_btn.removeEventListener("click", this.handleFriendClick);
        this.block_btn.removeEventListener("click", this.handleBlockClick);
    }

}