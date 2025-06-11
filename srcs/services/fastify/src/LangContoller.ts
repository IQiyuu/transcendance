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
        document.getElementById('offline').textContent = this.file['play_local'];
        document.getElementById('matchmaking').textContent = this.file['play_online'];
        document.getElementById('tournament_button').textContent = this.file['tournament'];
        document.getElementById('profile_button').textContent = this.file['profile'];
        document.getElementById('upload_btn').textContent = this.file['upload_txt'];
        document.getElementById('about_button').textContent = this.file['about'];
        document.getElementById('friend_text').textContent = this.file['friends'];
        document.getElementById('histo_text').textContent = this.file['historique'];
        (document.getElementById('search_player_in') as HTMLInputElement).placeholder = this.file['search'];
    }

    addEvents() {
        this.lang_select.addEventListener("change", async (event) => {
            event.preventDefault();

            var val = (event.target as HTMLSelectElement).value;
            await this.loadFile(val);
            this.updateContent();

            const body = {
                user: this.username,
                lang: val
            };
            try {
                const resp = await fetch(`/db/update/lang`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
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