import {ClientSocket} from "./ClientSocket.js";
import { LangController } from "./LangContoller.js";
import {GameClientSocket} from "./GameClientSocket.js";
// import {Game} from "./pong.js";
import {GameController} from "./pong.js";
import {TournamentController} from "./TournamentController.js";
import { FriendController } from "./FriendController.js";
// import { connect } from "http2";

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
    private	auth_btn = document.getElementById("auth_btn");


    private	check_btn = document.getElementById("check_btn");
    private enable_auth_btn = document.getElementById("google_auth_enable");
    private fa_btn = document.getElementById("fa_btn");
    private switch_fa_btn = document.getElementById("switch_fa_btn");
    private QRCode = document.getElementById("QRCode") as HTMLInputElement;
    private keys = document.getElementById("keys") as HTMLInputElement;
    private upload_btn = document.getElementById("upload_btn");
    private profile_cross = document.getElementById("profile_cross");

    private password_form = (document.getElementById("passwordForm") as HTMLFormElement);

    private profile_card = document.getElementById("profile_card");
    private file_input = document.getElementById("file_input")
	
    private searchError = document.getElementById("searchError");

    private	histo_list = document.getElementById("histo_list");

    private	camera_icon = document.getElementById("camera_icon");
    private	profile_picture = document.getElementById("profile_picture");
    private	profile_picture_overlay = document.getElementById("profile_picture_overlay");

    private	profile_username_tag = document.getElementById("profile_username");
    private	register_date_tag = document.getElementById("profile_creation");

    private cameraIcon = document.getElementById("camera_icon");
    private profileOverlay = document.getElementById("profile_picture_overlay");
    private closeBtn = document.getElementById("profile_cross");

    private cancelBtn = document.getElementById("cancel");
    private usernameJps = document.getElementById("profile_username");
    private jspBtn = document.getElementById("jsp_btn");

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
        // Clique sur l'icône → montre la modale
        this.cameraIcon.addEventListener("click", () => {
            this.profileOverlay.classList.remove("hidden");
        });

        // Clique sur la croix ✖ → cache la modale
        this.closeBtn.addEventListener("click", () => {
            this.profileOverlay.classList.add("hidden");
        });

        this.cancelBtn.addEventListener("click", () => {
            this.closePasswordPopup();
        });

        this.usernameJps.addEventListener("click", () => {
            this.editUsername();
        });

        this.jspBtn.addEventListener("click", () => {
            this.openPasswordPopup();
        });

        // this.profile_username_tag.addEventListener("mouseover", async (event) => {
        //     event.preventDefault();

        //     if (this.profile_username == this.username && )
        //         this.profile_username_tag.textContent = "EMOJI " + this.profile_username_tag.textContent;
        // });

        this.profile_username_tag.addEventListener("mouseout", async (event) => {
            event.preventDefault();
            
            if (this.profile_username == this.username)
                this.profile_username_tag.textContent = this.profile_username;
        });

        // Player's search
        this.search_inp.addEventListener("keydown", async (event) => {
            if (event.key == 'Enter') {
                this.searchError.classList.replace("flex", "hidden");
                this.profile_username = this.search_inp.value;
                await this.searchPlayerHandler();
                this.printPage();
            }
        });

        this.search_btn.addEventListener("click", async (event) => {
            event.preventDefault();

            this.searchError.classList.replace("flex", "hidden");
            this.profile_username = this.search_inp.value;
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
        // Activate / Desactivate Google authentificator
        this.auth_btn.addEventListener('click', async (event) => {
            event.preventDefault();
            const res = await fetch('/check-email-status', {
            method: 'GET',
                credentials: 'include', 
            });
            if (res.ok) {
                const data = await res.json();
                if(data.success == 0)
                {
                    window.open('/google-auth', '42 AUTH');
                    const res2 = await fetch('/check-email-status', {
                    method: 'GET',
                        credentials: 'include', 
                    });
                    if (res2.ok)
                    {
                        const data2 = await res2.json();
                        if (data2.success == 1)
                        {
                            this.enable_auth_btn.classList.replace("enable_auth_btn", "disable_auth_btn");
                           // this.google_auth.textContent = "Desactiver Google authentificator";
                        }
                    }
                }
                else 
                {
                    await fetch('/desable_auth');
                    this.enable_auth_btn.classList.replace("disable_auth_btn", "enable_auth_btn");
                    //this.google_auth.textContent = "Activer Google authentificator";
                }
            }

        // Connexion with Google authentificator
        });
        this.check_btn.addEventListener('click', async (event) => {
            event.preventDefault();
            window.open('/check', '42 AUTH');
            window.addEventListener("message", async (event) => {
                if (event.origin !== window.location.origin) 
                    return; 
                const { username, success } = event.data;
                const res = await fetch('/check-2fa-status-in', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    credentials: 'include', 
                    body: JSON.stringify({ username : username }) 
                });
                if (res.ok) {
                    const data = await res.json();
                    if (success && data.success == 0) {
                        this.site.setUsername(username);
                        this.site.connect();
                    }
                    if (success && data.success == 1)
                    {
                        const res = await fetch('/set-user-cookie', {
                            method: 'POST',
                            headers: {
                            'Content-Type': 'application/json'
                            },
                            credentials: 'include', 
                            body: JSON.stringify({ username : username }) 
                        });
                        this.site.hide_register_page();
                        this.site.print_fa_page();
                    }
                }
                else
                    this.site.connect();
            });
        });

        this.fa_btn.addEventListener('click', async (event) => {
            const res = await fetch('/2fa', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                credentials: 'include', 
                body: JSON.stringify({ userToken: this.keys.value }) 
            });

            const data = await res.json();
            if (data.twofa === 1)
            {

                this.site.setUsername(data.username);
                this.site.hide_fa_page();
                this.site.connect();
            }
        });

        this.switch_fa_btn.addEventListener('click', async (event) => {
            event.preventDefault();
            const res = await fetch('/enable-2fa', {
                method: 'GET',
                credentials: 'include'
            });
            if (res.ok) {
            const data = await res.json();
            if (data.twofa && this.QRCode !== null && data.twofa_activate) {
                this.switch_fa_btn.textContent = this.site.getText("2FA_disable");
                this.QRCode.src = data.twofa.startsWith('data:image') 
                ? data.twofa 
                : `data:image/png;base64,${data.twofa}`;
                this.QRCode.classList.replace("hidden", "block");
        }
            else {
                this.QRCode.classList.replace("block" , "hidden");
                this.switch_fa_btn.textContent = this.site.getText("2FA_enable");
                
        }

    }

    });
        this.upload_btn.addEventListener('click', async (event) => {
            event.preventDefault();

        });

        // croix du changement de photo de profile
        this.profile_cross.addEventListener("click", async (event) => {
            event.preventDefault();
            document.getElementById("profile_picture_overlay").classList.replace("flex", "hidden");
            (document.getElementById("previsu_picture") as HTMLImageElement).src = "";
            (document.getElementById("file_input") as HTMLInputElement).value = "";
        });

        // echape du changement de photo de profile
        this.profile_card.addEventListener("keydown", async (event) => {
            if (!document.getElementById("profile_picture_overlay").classList.contains("hidden")) {
                event.preventDefault();
                if (event.key === "Escape") {
                    document.getElementById("profile_picture_overlay").classList.replace("flex", "hidden");
                    (document.getElementById("previsu_picture") as HTMLImageElement).src = "";
                    (document.getElementById("file_input") as HTMLInputElement).value = "";
                }
            }
        });

        // previsualiser la photo de profile selectionnee
        this.file_input.addEventListener("change", async (event) => {
            const file = (event.target as HTMLInputElement).files[0];
            const previsuImage = document.getElementById("previsu_picture") as HTMLImageElement;
            if (file) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    previsuImage.src = e.target.result as string;
                };
                
                reader.readAsDataURL(file);
            }
        });

        // upload une photo de profile avec le boutton
        this.upload_btn.addEventListener("click", async (event) => {
            event.preventDefault();

            const formData = new FormData();
            const fileInput = document.getElementById('file_input') as HTMLInputElement;
            if (fileInput.files[0]) {
                formData.append('file', fileInput.files[0]);
                try {
                    const response = await fetch(`/upload/picture/${this.username}`, {
                        method: 'POST',
                        body: formData,
                    });
                    if (!response.ok)
                        console.log("error in file upload.");
                    else {
                        document.getElementById("profile_picture_overlay").classList.replace("flex", "hidden");
                        (document.getElementById("previsu_picture") as HTMLImageElement).src = "";
                        (document.getElementById("file_input") as HTMLInputElement).value = "";
                        this.picture_path = "../assets/imgs/" + this.username + ".jpg";
                        (this.profile_picture as HTMLImageElement).src = this.picture_path + "?" + new Date().getTime();
                    }
                } catch (error) {
                console.error("error: ", error);
                }
            } else {
                console.log("No file selected.");
            }
        });

        // Validation du formulaire de changement de mot de passe
        this.password_form.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Récupération des valeurs des champs
            const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
            const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
            const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
            console.log("ERROR1");
            // Vérification que les mots de passe correspondent
            if (newPassword !== confirmPassword) {
                this.showError("Les nouveaux mots de passe ne correspondent pas.");
                console.log("ERROR1 MISMATCH");
                return;
            }

            if (currentPassword == newPassword) {
                this.showError("Les nouveaux mots de passe ne doivent pas etre identiques");
                console.log("ERROR1 MISMATCH");
                return;
            }

            const body = {
                username: "IQiyu", // changer par this.username dans la classe
                password: currentPassword,
                newPassword: newPassword
            };
            try {
                console.log(body);
                const req = await fetch('/db/update/password', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body)
                    });
                console.log("ERROR2: ");
                const data = await req.json();
                console.log("ERROR2: ", data);
                console.log("ERROR3: ", data.error);
                if (!data.success)
                    throw(Error(data.error));

                console.log("password updated.");
                this.closePasswordPopup();
                this.password_form.reset();
            } catch (error) {
                alert(error);
            }
        });

    }
        // Ouvrir la popup
    openPasswordPopup() {
        document.getElementById('passwordPopup').classList.remove('hidden');
    }

    // Fermer la popup
    closePasswordPopup() {
        document.getElementById('passwordPopup').classList.add('hidden');
    }

    // Afficher les messages d'erreur
    showError(message) {
        const errorMessagesDiv = document.getElementById('errorMessages');
        const errorMessageText = document.getElementById('errorMessageText');
        errorMessageText.innerText = message;
        errorMessagesDiv.classList.remove('hidden');
    }

    editUsername() {
        var currentUsername = document.getElementById('profile_username').innerText;
        var inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.value = currentUsername;
        inputField.id = 'profile_username_input';

        inputField.classList.add(
            'text-xl',
            'font-semibold',
            'text-center',
            'border-b',
            'border-gray-400',
            'focus:outline-none',
            'focus:border-blue-500',
            'px-2',
            'py-1'
        );

        var usernameElement = document.getElementById('profile_username');
        usernameElement.innerHTML = '';
        usernameElement.appendChild(inputField);

        inputField.focus();

        inputField.addEventListener('blur', () => {
            this.saveUsername(inputField.value);
        });

        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.saveUsername(inputField.value);
            }
        });
    }

        async saveUsername(newUsername) {
            document.getElementById('profile_username').innerText = newUsername;
            console.log("Nouvelle valeur du nom d'utilisateur : " + newUsername);

            const body = {
                username: "IQiyu", // changer par this.username dans la classe
                newUsername: newUsername
            };
            try {
                const req = await fetch('/db/update/username', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body)
                    });

                const data = await req.json();

                if (!data.success)
                    throw(Error(data.error));
                // this.username = newUsername;
                // this.game.setUsername(this.username);
                // this.profile.setUsername(this.username);
                // this.tournament.setUsername(this.username);
                // this.friends.setUsername(this.username);
                console.log("username updated.");
            } catch (error) {
                alert(error);
            }
        }

    //Search for the player, and store datas
    async searchPlayerHandler(){
        try {
            const req = await fetch(`/profile/${this.profile_username}`, {
                method: 'GET',
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
            });

            const data = await req.json();

            if (!data.success){
				this.profile_username = this.username;
                this.searchError.classList.replace("hidden", "flex");
                throw (Error(data.message));
			}
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
            this.histo = data.histo;
            return data;
        } catch (error){
            console.log(error);
        }
    }


	//VIEW
	async printHisto(){
        await this.searchHistoricHandler();
        var cpt = 0;
        var w = 0;
        this.histo.forEach((item) => {
            cpt++;
            if (cpt < 6) {
                let li = document.createElement("li");
                let a = document.createElement("a");
                a.innerText = item.winner_username;
                a.classList.add("text-green-500", "underline");
                a.href="#";
                a.id="profileDisplay";

                let a2 = document.createElement("a");
                a2.innerText = item.loser_username;
                a2.classList.add("text-green-500", "underline");
                 a2.href="#";
                a2.id="profileDisplay";

                li.appendChild(a);
                li.innerHTML += ": 11 VS ";
                li.appendChild(a2);
                li.innerHTML += " : " + item.loser_score + " at " + item.created_at;
            
                this.histo_list.appendChild(li);
                li.style.fontSize = "16px";
            }
            if (item.winner_username == this.profile_username)
                w++;
            document.getElementById("wr_card").textContent = `wr : ${(w / cpt * 100).toFixed(0)}%`;
        });
        if (cpt == 0)
            document.getElementById("wr_card").textContent = `wr : N/a`;
	}

    async	printPage(){
        if (this.profile_username === null){
            this.profile_username = this.username;
            await this.searchPlayerHandler();
        }

        //profile
        this.profile_page.classList.replace("hidden", "flex");
        this.profile_username_tag.innerText = this.profile_username;
        (this.profile_picture as HTMLImageElement).src = "../assets/imgs/" + this.picture_path + "?" + new Date().getTime(); // jsp ??
        this.register_date_tag.innerText = `${this.site.getText("member_since")}: ${this.register_date}`;

		if (this.profile_username != this.username){
			this.friend_div.classList.replace("hidden", "flex");
			this.fa_btn.classList.replace("flex", "hidden");
		}
		else{
			this.friend_div.classList.replace("flex", "hidden");
			this.fa_btn.classList.replace("hidden", "flex");
		}

        history.pushState({page: "profile", profile: this.profile_username}, "");
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

    private enable_fa_btn = document.getElementById("fa_btn_enable");
    private enable_auth_btn = document.getElementById("google_auth_enable");

    constructor(){
        this.profile = new ProfileController(this);
        this.game = new GameController(this);
        this.tournament = new TournamentController(this, this.game);
    }

    async initLang() {
        if (await this.is_logged())
            this.connect();

        this.lang = new LangController(this.username);
        if (this.friends)
            this.friends.setLang(this.lang);
        this.print_current_page();
    }

    getText(key: string){
        return this.lang.getFile()[key];
    }

    setUsername(key: string){
        this.username = key;
    }

    /**
     * CONTROLLER
     */
    add_events(){

        const google_auth = document.getElementById("google_auth");
        const switch_fa_btn = document.getElementById("switch_fa_btn");
        // Register/login page
        this.register_link.addEventListener("click", (event) => {
            event.preventDefault();
            const lang = this.lang.getFile();

            const formTitle = document.getElementById("form-title");
            const registerLink = document.getElementById("register-view"); //link for swapping register/login
            const logginBtn = document.getElementById("login_btn");

            this.isRegisterMode = !this.isRegisterMode;
            if (this.isRegisterMode) {
                formTitle.textContent = lang["register_title"];
                registerLink.textContent = lang["connexion_text"];
                logginBtn.textContent = lang["register_title"];
    
            } else {
                formTitle.textContent = lang["connexion_title"];
                registerLink.textContent = lang["register_text"];
                logginBtn.textContent = lang["connexion_title"];
            }
        });

        window.addEventListener("popstate", async (event) => {
            event.preventDefault();
            this.loadState(history.state);
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

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                const data = await response.json();
                
                if (data.success) {
                    this.isRegisterMode = false;
                    this.username = data.username;
                    if (url == "/login")
                    {
                        const res = await fetch('/check-2fa-status-in', {
                            method: 'POST',
                            headers: {
                            'Content-Type': 'application/json'
                            },
                            credentials: 'include', 
                            body: JSON.stringify({ username : data.username }) 
                        });
                        if (res.ok) {
                            const twofadata = await res.json();
                            if (twofadata.success == 1)
                            {
                                
                                const res = await fetch('/set-user-cookie', {
                                    method: 'POST',
                                    headers: {
                                    'Content-Type': 'application/json'
                                    },
                                    credentials: 'include', 
                                    body: JSON.stringify({ username : this.username }) 
                                });
                                this.print_fa_page();
                                this.hide_register_page();
                            }
                        }
                    }
                    else 
                    {
                        this.connect();
                    }
                    document.getElementById("errorAuth").classList.replace("block", "hidden");
                } else {
                    const error = document.getElementById("errorAuth") as HTMLParagraphElement;
                    error.textContent = this.getText(data.message];
                    error.classList.replace("hidden", "block");
                }
            } catch (error) {
                console.log("initFriendList");
                alert(error);
            }
        });

        // Menu link
        this.title_link.addEventListener("click", async (event) => {
            event.preventDefault();

            this.profile.setProfileUsername(null);
            this.hide_all();
            this.print_menu();
            this.print_btn_menu();
            if (this.tournament.hasTournament())
                this.tournament.print_tournament_rejoin_btn();
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
            event.preventDefault();
            const res = await fetch('/check-email-status', {
            method: 'GET',
                credentials: 'include', 
            });
            if (res.ok) {
                const data = await res.json();
                if(data.success == 1)
                {
                    this.enable_auth_btn.classList.replace("enable_auth_btn", "disable_auth_btn");
                    //google_auth.textContent = "Desactiver Google authentificator";
                }
                else 
                {
                    this.enable_auth_btn.classList.replace("disable_auth_btn", "enable_auth_btn");
                   // google_auth.textContent = "Activer Google authentificator";
                }
            }
            const res2 = await fetch('/check-2fa-status', {
            method: 'GET',
                credentials: 'include', 
            });
            if (res2.ok) {
                const data = await res2.json();
                if(data.success == 1)
                    this.enable_fa_btn.classList.replace("fa_btn_disable", "fa_btn_enable");
                else
                    this.enable_fa_btn.classList.replace("fa_btn_enable", "fa_btn_disable");
            }
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
            document.getElementById("fa-form").classList.replace("block", "hidden");
            document.body.classList.add("justify-center", "align-center", "flex");
            this.username = null;
            this.friends.removeEvents();
            this.game.setUsername(null);
            this.tournament.setUsername(null);
            this.profile.setUsername(null);
            this.profile.setProfileUsername(null);
            this.lang.setUsername(null);
            this.ws.close();
            this.ws = null;
            console.log(this.ws);
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

    loadLang() {
        this.lang.updateContent()
    }

    connect(){
        this.ws = new ClientSocket(this.username);
        
        if (this.lang)
            this.lang.initLang(this.username);
        this.game.setUsername(this.username);
        this.profile.setUsername(this.username);
        this.tournament.setUsername(this.username);
        this.store_session(this.username);
        this.hide_all();
        document.body.classList.remove("justify-center", "align-center", "flex");
        this.print_menu();
        this.friends = new FriendController(this.username, this.lang, this.ws);
        this.ws.setFriend(this.friends, this, this.profile);
    }

    /**
     * VIEW PART
     */

    print_register_page(){
        document.getElementById("login-form").classList.replace("hidden", "flex");
    }

    hide_register_page(){
        document.getElementById("login-form").classList.replace("flex", "hidden");
    }

    print_main_page(){
        this.main_page.classList.replace("hidden", "block");
        history.pushState({page: "main"}, "");
    }

    hide_main_page(){
        this.main_page.classList.replace("hidden", "block");
    }

    print_fa_page(){
        document.getElementById("fa-form").classList.replace("hidden", "block");
    }

    hide_fa_page(){
        document.getElementById("fa-form").classList.replace("block", "hidden");
    }
    print_menu(){
        this.print_main_page();
        this.menu.classList.replace("hidden", "block");
        if (this.tournament !== null && this.tournament.hasTournament())
            this.tournament.print_tournament_rejoin_btn();
    }

    hide_menu(){
        this.menu.classList.replace("block", "hidden");
    }

    print_about_page(){
        this.about.classList.replace("hidden", "flex");
        history.pushState({page: "about"}, "");
    }
    
    hide_about_page(){
        this.about.classList.replace("flex", "hidden");
    }

    print_tournament_btns(){
        this.tournament_create_btn.classList.replace("hidden", "flex");
        this.tournament_join_btn.classList.replace("hidden", "flex");
        history.pushState({page: "tournament_menu"}, "");
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

    async loadState(obj) {
        this.hide_all();

        switch (obj.page) {
            case "main":
                this.print_menu();
                break ;
            case "profile":
                if (obj && obj.profile) {
                    this.profile.setProfileUsername(obj.profile);
                    await this.profile.searchPlayerHandler();
                }
                this.profile.printPage();
                break ;
            case "about":
                this.print_about_page();
                break ;
            case "tournament_menu":
                this.print_tournament_btns();
                break ;
        }
    }
};
