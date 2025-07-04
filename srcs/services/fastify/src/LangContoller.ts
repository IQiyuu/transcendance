export class LangController{

    private file: Object = null;

    private username: string = null;

    private lang_select = (document.getElementById("lang_select") as HTMLSelectElement);

    constructor(username){
        this.initLang(username);
    }

    setUsername(username: string) {
        this.username = username;
    }
    
    getFile() {
        return this.file;
    }

    async initLang(username: string) {
        var lang = "en";
        if (username)
            lang = await this.loadLang(username);
        await this.loadFile(lang);
        this.updateContent();
        this.username = username;
    }

    async loadLang(username: string) {
        var lang = "en";

        try {
            const response = await fetch(`/db/select/lang/${username}`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success)
                lang = data.lang;
        } catch (error) {
            alert(error + " setting lang to english");
        }
        this.lang_select.value = lang;
        return lang;
    }
    

    async loadFile(lang: string="fr") {
        try {
            const file = await fetch(`/assets/locales/${lang}/translation.json`);
            if (!file.ok)
                throw (Error("Lang file wasnt fetched, setting a default file"));
            this.file = await file.json();
            if (this.file == null)
                throw (Error("Not parsed, setting a default file"));
        } catch (error) {     
            alert(error);
            console.log("loadFile");
            this.file = {
                "title" : "Trong the game",
                "username": "Username",
                "password": "Password",
                "register_text": "Register"
            }
        }
    }

    // translate content
    updateContent(){
        document.getElementById('form-title').textContent = this.file['connexion_title'];
        document.querySelector("label[for='username']").textContent = this.file['username'];
        document.querySelector("label[for='password']").textContent = this.file['password'];
        document.getElementById('register-view').textContent = this.file['register_text'];
        document.getElementById('game_title').textContent = this.file['title'];
        document.getElementById('div_title').textContent = this.file['change_pp'];
        document.getElementById('login_btn').textContent = this.file['connexion_title'];
        document.getElementById('logout_btn').textContent = this.file['logout_btn'];
        document.getElementById('offline').textContent = this.file['play_local'];
        document.getElementById('tournament_button').textContent = this.file['tournament'];
        document.getElementById('profile_button').textContent = this.file['profile'];
        document.getElementById('upload_btn').textContent = this.file['upload_txt'];
        document.getElementById('about_button').textContent = this.file['about'];
        document.getElementById('friend_text').textContent = this.file['friends'];
        document.getElementById('histo_text').textContent = this.file['historique'];

        document.getElementById('google_auth_btn').textContent = this.file['google_auth'];
        if (document.getElementById('fa_btn_enable') != null)
            document.getElementById('fa_btn_enable').textContent = this.file['2FA_enable'];
        else
            document.getElementById('fa_btn_disable').textContent = this.file['2FA_disable'];

        document.getElementById('google_auth_enable').textContent = this.file['google_switch_enable'];

        document.getElementById('pass_change').textContent = this.file['pass_change'];
        document.getElementById('pass_current').textContent = this.file['pass_current'];
        document.getElementById('pass_new').textContent = this.file['pass_new'];
        document.getElementById('pass_confirm').textContent = this.file['pass_confirm'];
        document.getElementById('modal-confirm-yes').textContent = this.file['modal-confirm-yes'];
        document.getElementById('modal-confirm-no').textContent = this.file['modal-confirm-no'];
        document.getElementById('cancel').textContent = this.file['cancel'];
        document.getElementById('confirm').textContent = this.file['confirm'];
        document.getElementById('game_start').textContent = this.file['game_start'];
        document.getElementById('wr_card').textContent = this.file['wr'];
        (document.getElementById('search_player_in') as HTMLInputElement).placeholder = this.file['search'];

        if (document.getElementById('waiting_online') && document.getElementById('cancel_game')) {
            document.getElementById('waiting_online').textContent = this.file['waiting_online'];
            document.getElementById('cancel_game').innerHTML = this.file['cancel_mm'];
        }
        else
            document.getElementById('matchmaking').textContent = this.file['play_online'];
    
        document.getElementById("profile_creation").textContent
            = this.file["member_since"] + " " + (document.getElementById("profile_creation").textContent).split(":")[1];
    
        // tournament
        document.getElementById("create_tournament").textContent = this.file["create_tour"];
        document.getElementById("cr_tour").textContent = this.file["crea_tour"];
        document.getElementById("nam_tour").textContent = this.file["nam_tour"];
        document.getElementById("av_tour").textContent = this.file["av_tour"];
        document.getElementById("curr_tour").textContent = this.file["curr_tour"];
        document.getElementById("join_tour").textContent = this.file["join_tour"];
        document.getElementById("tournament_creation").textContent = this.file["crea_tour_btn"];
        document.getElementById("tour_win_msg").textContent = this.file["tour_win_msg"];
        document.getElementById("tour_lose_msg").textContent = this.file["tour_lose_msg"];
        document.getElementById("tour_quit_btn").textContent = this.file["tour_quit_btn"];
        document.getElementById("tour_bracket").textContent = this.file["tour_bracket"];
        

        if (document.getElementById("usr_tour") != null) {
            document.getElementById("usr_tour").textContent = this.file["usr_tour"];
            document.getElementById("role_tour").textContent = this.file["role_tour"];
            document.getElementById("own_tour").textContent = this.file["own_tour"];
            for (let element of document.getElementsByClassName("play_tour")) element.textContent = this.file["play_tour"];
            document.getElementById("start_tour").textContent = this.file["start_tour"];
            document.getElementById("leav_tour").textContent = this.file["leav_tour"];
        }
    }

    addEvents() {
        this.lang_select.addEventListener("change", async (event) => {
            event.preventDefault();

            var val = (event.target as HTMLSelectElement).value;
            await this.loadFile(val);
            this.updateContent();

            if (!this.username)
                return ;

            const body = {
                user: this.username,
                lang: val
            };
            try {
                const resp = await fetch(`/db/update/lang`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include',
                    body: JSON.stringify(body)
                });
                const data = await resp.json();
                if (!data.success)
                    throw(Error(data.error));
            } catch (error) {
                alert(error);
            }
        });
    }
}