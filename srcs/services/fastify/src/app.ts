let _username = sessionStorage.username;
let lang_file = null;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form");
    const formTitle = document.getElementById("form-title");
    const registerLink = document.getElementById("register-view");
    const logginBtn = document.getElementById("login_btn");
    let isRegisterMode = false;

    // swap entre connexion et inscription
    registerLink.addEventListener("click", (event) => {
        event.preventDefault();

        isRegisterMode = !isRegisterMode;
        if (isRegisterMode) {
            formTitle.textContent = lang_file["register_title"];
            registerLink.textContent = lang_file["connexion_text"];
            logginBtn.textContent = lang_file["register_title"];

        } else {
            formTitle.textContent = lang_file["connexion_title"];
            registerLink.textContent = lang_file["register_text"];
            logginBtn.textContent = lang_file["connexion_title"];
        }
    });

    // formulaire de connexion / inscription
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username") as HTMLInputElement;
        const password = document.getElementById("password") as HTMLInputElement;

        const url = isRegisterMode ? "/register" : "/login";
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

            const data = await response.json();
            console.log("Réponse du serveur :", data);

            if (data.success) {
                _username = data.username;
                sessionStorage.setItem('username', data.username);
                sessionStorage.setItem('userId', data.id);
                const loginForm = document.getElementById("login-form") as HTMLDivElement;
                const pongGame = document.getElementById("site") as HTMLDivElement;
                document.body.classList.remove("justify-center", "align-center", "flex");
                loginForm.classList.replace("flex", "hidden");
                pongGame.classList.replace("hidden", "block");
                init();
                fillCanvas();
            } else {
                const error = document.getElementById("errorAuth") as HTMLParagraphElement;
                error.textContent = lang_file[data.message];
                error.classList.replace("hidden", "block");
                console.log("Auth error");
            }
        } catch (error) {
            console.error("error ", error);
            alert("Une erreur est survenue.");
        }
    });
});

// check si l'utilisateur est connecte
async function checkIfLoggedIn() {
    try {
        const response = await fetch('/protected', {
            method: 'GET',
            credentials: 'include',
        });

        const data = await response.json();

        if (response.ok && data.success) {
            sessionStorage.setItem('username', data.username);
            sessionStorage.setItem('userId', data.id);
            _username = data.username;
            console.log('Utilisateur connecté:', data.username);
            init();
            return true;
        } else {
            console.log('Utilisateur non connecté');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de la connexion:', error);
        return false;
    }
}

function removeFriend(username) {
    const list = document.getElementById("friendlist");
    if (!list)
        return ;
    const divs = list.querySelectorAll("div");

    divs.forEach((div) => {
        if (div.id == `${username}_friendlist`) {
            console.log('elem removed');
            list.removeChild(div);
            return ;
        }
    });
}

function addFriend(username, pp) {
    const friendlist = document.getElementById("friendlist");
    const div = document.createElement("div");
    const img = document.createElement("img");
    const span = document.createElement("span");
    const p = document.createElement("p");
    div.className = "w-full flex items-center justify-between p-3 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer";
    div.id = username+"_friendlist";
    let usname = username

    img.src = pp;
    img.className = "rounded-full";
    img.style.width = "7%";

    span.className = "flex w-3 h-3 me-3 bg-red-500 rounded-full";

    p.className = 'text-lg';
    p.textContent = username.length > 10 ? username.substring(0,8)+"..":username;
                
    div.appendChild(img);
    div.appendChild(span);
    div.appendChild(p);

    // afficher la popup (comme sur chesscom) d'un resume du joueur vite aif
    div.addEventListener("contextmenu", async (event) => {
        event.preventDefault();
    
        // Supprimer les anciennes popups s'il y en a déjà une
        const existing = document.getElementById("profile_window");
        if (existing) existing.remove();
    
        const popup = document.createElement("div");
        const popup_img = document.createElement("img");
        const popup_span = document.createElement("span");
        const popup_name = document.createElement("p");
        const add_btn = document.createElement("button");
        const close_btn = document.createElement("button");
    
        popup.id = "profile_window";
        
        // positionne la ou est la souris
        popup.classList.add("absolute");
        popup.style.left = `${event.clientX}px`;
        popup.style.top = `${event.clientY}px`;
        popup.style.backgroundColor = "grey";
    
        popup_img.src = pp;
        popup_img.classList.add("cursor-pointer");
    
        popup_name.textContent = usname;
    
        add_btn.textContent = "Add Friend";
        add_btn.classList.add("cursor-pointer");
    
        close_btn.textContent = "×";
        close_btn.style.color = "red";
        close_btn.classList.add("cursor-pointer");
    
        close_btn.addEventListener("click", () => {
            popup.remove();
        });
    
        popup_img.addEventListener("click", () => {
            display_profile(usname);
        });

        add_btn.addEventListener("click", () => {
            console.log("invite a jouer");
        });
    
        popup.appendChild(close_btn);
        popup.appendChild(popup_img);
        popup.appendChild(popup_span);
        popup.appendChild(popup_name);
        popup.appendChild(add_btn);
    
        document.body.appendChild(popup);
    });
    

    friendlist.appendChild(div);
}

async function initFriendlist() {
    try {
        const response = await fetch(`/db/friends/friendlist/${_username}`, {
            method: "GET",
        });

        const data = await response.json();

        if (!data.success) {
            console.log("error: ", data);
        } else {
            console.log(data);
            for (let user of data.friends) {
                addFriend(user.username, user.pp);
            }
        }
    } catch (error) {
        console.log("error: ", error);
    }
}

// choisit l'affichage en fonction de l'utilisateur (connecte ou non)
checkIfLoggedIn().then((isLoggedIn) => {
    const loginForm = document.getElementById("login-form") as HTMLDivElement;
    const pongGame = document.getElementById("site") as HTMLDivElement;

    if (isLoggedIn) {
        pongGame.classList.replace("hidden", "block");
        initFriendlist();
        console.log("COUCOU");
        document.body.classList.remove("justify-center", "align-center", "flex");
    }
    else
        loginForm.classList.replace("hidden", "flex");

});

// GET et afficher les infos du profile / historique
async function display_profile(username) {
    const list = document.getElementById("histo_list") as HTMLUListElement;
    try {
        // requete des infos pour afficher le profile
        const profile_req = await fetch(`/profile/${username}`, {
            method: 'GET',
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
        });

        const profile = await profile_req.json();
        if (!profile.datas) {
            console.log("player not found.");
            return ;
        }
        (document.getElementById("profile_picture") as HTMLImageElement).src = "assets/imgs/" + profile.datas.picture_path + "?" + new Date().getTime();
        document.getElementById("profile_username").innerText = profile.datas.username;
        document.getElementById("profile_creation").innerText = `${lang_file["member_since"]}: ${profile.datas.created_at}`;
        const friendDiv = document.getElementById("friend_div");
        const faBtn = document.getElementById("fa_btn");
        if (profile.datas.username == _username) {
            friendDiv.classList.replace("flex", "hidden");
            faBtn.classList.replace("hidden", "relative");
        }
        else {
            const responseFriends = await fetch(`/db/friends/${_username}/${username}`, {
                method: 'GET',
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
            });

            const friends = await responseFriends.json();

            if (!friends.success)
                console.log("error: ", friends.error);
            else {
                console.log(friends);
                document.getElementById("friend_btn").textContent = lang_file[friends.message];
                document.getElementById("block_btn").textContent = friends.emoji;
            }

            console.log(friends.message);
            friendDiv.classList.replace("hidden", "flex");
            faBtn.classList.replace("relative", "hidden");
        }

        // requete des games
        const histo_req = await fetch(`/historic/${username}`, {
            method: 'GET',
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
        });
        const data = await histo_req.json();
        console.log(data);
        list.replaceChildren();

        // affiche l'historique
        if (data.success) {
            var cpt = 0;
            var w = 0;
            data.datas.forEach((item) => {
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
            
                    list.appendChild(li);
                    li.style.fontSize = "16px";
                }
                if (item.winner_username == profile.datas.username)
                    w++;
                document.getElementById("wr_card").textContent = `${lang_file["wr"]} : ${(w / cpt * 100).toFixed(0)}%`;
            });
            if (cpt == 0)
                document.getElementById("wr_card").textContent = `${lang_file["wr"]} : N/a`;
        }
        // change les a (lien) de l'historique par des liens qui menent a la page de profile
        document.querySelectorAll("a#profileDisplay").forEach((item) => { 
            item.addEventListener("click", async (event) => {
                    event.preventDefault();
                    await display_profile(item.textContent);
                });
        });
        document.getElementById("player_profile").classList.replace("hidden", "flex");
        if (cpt > 0) {
            document.getElementById("wr").textContent = `${w} / ${cpt}` ;
            let wr = w/(cpt)*100;
            document.getElementById("percent").setAttribute("stroke-dasharray", `${wr}, 100`);
        } else {
            document.getElementById("wr").textContent = "N/A" ;
            document.getElementById("percent").setAttribute("stroke-dasharray", `50, 100`);
            document.getElementById("histo").classList.replace("hidden", "block");
        }
        document.getElementById("histo").classList.replace("hidden", "block");
    } catch (error) {
        console.log("error fetching db: ", error);
    }
}

// afficher le profile
document.getElementById("profile_button").addEventListener("click", async (event) => {
    document.getElementById("menu").classList.replace("block", "hidden");
    await display_profile(_username);
});

// afficher le menu du jeu
async function displayMenu() {
    document.getElementById("player_profile").classList.add("hidden");
    document.getElementById("game_box").classList.replace("flex", "hidden");
    document.getElementById("menu").classList.replace("hidden", "block");
    document.getElementById("about").classList.replace("flex", "hidden");
}

// retourner au menu
document.getElementById("game_title").addEventListener("click", async (event) => {
    console.log("back to menu");
    await displayMenu();
});

// input recherche de joueur
document.getElementById("search_player_in").addEventListener("keydown", async (event) => {
    if(event.key == 'Enter') {
        const input = (event.target as HTMLInputElement);
        await display_profile(input.value);
        input.value = "";
    }
});

// button recherche de profile de joueur
document.getElementById("search_player_btn").addEventListener("click", async (event) => {
    event.preventDefault();
    const input = ((document.getElementById("search_player_in")) as HTMLInputElement);
    await display_profile(input.value);
    input.value = "";
});

const pp = document.getElementById("profile_picture") as HTMLImageElement;
const ci = document.getElementById("camera_icon");

// clique sur la photo de profile
pp.addEventListener("click", async (event) => {
    const user_page = document.getElementById("profile_username").textContent;
    if (user_page == _username) {
        document.getElementById("profile_picture_overlay").classList.replace("hidden", "flex");
        ci.classList.replace("opacity-60", "opacity-0");
    }
});

// clique sur la photo de profile
ci.addEventListener("click", async (event) => {
    const user_page = document.getElementById("profile_username").textContent;
    if (user_page == _username) {
        ci.classList.replace("opacity-60", "opacity-0");
        document.getElementById("profile_picture_overlay").classList.replace("hidden", "flex");
    }
});

// hover sur la photo de profile
pp.addEventListener('mouseout', () => {
    const user_page = document.getElementById("profile_username").textContent;
    if (user_page == _username)
        ci.classList.replace("opacity-60", "opacity-0");
});
pp.addEventListener("mouseover", async (event) => {
    const user_page = document.getElementById("profile_username").textContent;
    if (user_page == _username)
        ci.classList.replace("opacity-0", "opacity-60");
});

// croix du changement de photo de profile
document.getElementById("profile_cross").addEventListener("click", async (event) => {
    event.preventDefault();
    document.getElementById("profile_picture_overlay").classList.replace("flex", "hidden");
    (document.getElementById("previsu_picture") as HTMLImageElement).src = "";
    (document.getElementById("file_input") as HTMLInputElement).value = "";
});

// echape du changement de photo de profile
document.addEventListener("keydown", async (event) => {
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
document.getElementById("file_input").addEventListener("change", async (event) => {
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
document.getElementById("upload_btn").addEventListener("click", async (event) => {
    event.preventDefault();

    const formData = new FormData();
    const fileInput = document.getElementById('file_input') as HTMLInputElement;
    if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
        try {
            const response = await fetch(`/upload/picture/${_username}`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok)
                console.log("error in file upload.");
            else {
                console.log("file uploaded.");
                document.getElementById("profile_picture_overlay").classList.replace("flex", "hidden");
                (document.getElementById("previsu_picture") as HTMLImageElement).src = "";
                (document.getElementById("file_input") as HTMLInputElement).value = "";
                pp.src = "assets/imgs/" + _username + ".jpg?" + new Date().getTime();
            }
        } catch (error) {
          console.error("error: ", error);
        }
      } else {
        console.log("No file selected.");
      }
});

document.getElementById("profile_username").addEventListener("click", async (event) => {
    event.preventDefault();

    document.getElementById("profile_picture_overlay").classList.replace("hidden", "flex");
});

// document.getElementById("username_btn").addEventListener("click", async (event) => {
//     event.preventDefault();

//     const newusername = (document.getElementById("username_input") as HTMLInputElement).value;
//     console.log(newusername);
//     const body = {
//         username: _username,
//         newusername: newusername
//     };
//     console.log(JSON.stringify(body));
//     if (newusername != "") {
//         try {
//             const response = await fetch(`/upload/username/${_username}`, {
//                 method: 'POST',
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(body),
//             });
//             if (!response.ok)
//                 console.log("error in username upload.");
//             else {
//                 console.log("username uploaded.");
//                 document.getElementById("profile_username_overlay").style.display = "none";
//                 _username = newusername;
//                 display_profile(_username);
//             }
//         } catch (error) {
//           console.error("error: ", error);
//         }
//     }
// });

document.getElementById("friend_btn").addEventListener("click", async (event) => {
    const friend_uname = document.getElementById("profile_username").textContent;
    const body = {
        user: _username,
        friend: friend_uname,
    }

    console.log("body: ", body);

    const friend_req = await fetch(`/db/friends/update`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await friend_req.json();
    console.log("reponse du server: ", data);
    if (data.success) {
        document.getElementById("friend_btn").textContent = lang_file[data.message];
        if (data.status == "accepted") {
            try {
                const friend = data.friend;
                const me = data.user;
                addFriend(friend.username, friend.pp);
                _ws.send(JSON.stringify({
                    type: "addFriend",
                    user: me.username,
                    pp: me.pp,
                    target: friend.username,
                }));
            } catch (error) {

                console.log("error: " + error);
            }
        } else if (data.status == null) {
            removeFriend(friend_uname)
            _ws.send(JSON.stringify({
                type: "removeFriend",
                user: _username,
                target: friend_uname,
            }));
        }
    }
    else
        console.log("errorr: ", data.error);
});


document.getElementById("block_btn").addEventListener("click", async (event) => {
    const toBlock = document.getElementById("profile_username").textContent;
    const body = {
        user: _username,
        friend: toBlock,
    }

    console.log("body: ", body);

    const friend_req = await fetch(`/db/friends/block`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await friend_req.json();
    console.log(data);
    if (data.success) {
        document.getElementById("block_btn").textContent = data.blocking ? "🔓" : "🔒";
        document.getElementById("friend_btn").textContent = data.blocking ? lang_file["send_yblock"] : lang_file["send_inv"];
        if (data.blocking) {
            _ws.send(JSON.stringify({
                type: "removeFriend",
                user: _username,
                target: toBlock,
            }));
            removeFriend(toBlock);
        }
    }
    else
        console.log("error: ", data.error);
});

document.getElementById("offline").addEventListener("click", async (event) => {
    event.preventDefault();

    console.log("STARTING");
    document.getElementById("menu").classList.replace("flex", "hidden");
    try {
        const body = {
            username: _username,
        }
        const resp = await fetch(`/game/local/create`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await resp.json();
        if (data.success) {
            _gameId = data.id;
            _mod = 'l';
            startGame(null, _ws, true);
        }
    } catch (error) {
        console.log("error: ", error);
    }
});

document.getElementById("about_button").addEventListener("click", async (event) => {
    event.preventDefault();

    document.getElementById("menu").classList.replace("block", "hidden");
    document.getElementById("about").classList.replace("hidden", "flex");
});


function updateContent() {
  document.getElementById('form-title').textContent = lang_file['connexion_title'];
  document.querySelector("label[for='username']").textContent = lang_file['username'];
  document.querySelector("label[for='password']").textContent = lang_file['password'];
  document.getElementById('register-view').textContent = lang_file['register_text'];
  document.getElementById('game_title').textContent = lang_file['title'];
  document.getElementById('div_title').textContent = lang_file['change_pp'];
  document.getElementById('login_btn').textContent = lang_file['connexion_title'];
  document.getElementById('offline').textContent = lang_file['play_local'];
  document.getElementById('matchmaking').textContent = lang_file['play_online'];
  document.getElementById('tournament_button').textContent = lang_file['tournament'];
  document.getElementById('profile_button').textContent = lang_file['profile'];
  document.getElementById('upload_btn').textContent = lang_file['upload_txt'];
  document.getElementById('about_button').textContent = lang_file['about'];
  document.getElementById('friend_text').textContent = lang_file['friends'];
  document.getElementById('histo_text').textContent = lang_file['historique'];
  (document.getElementById('search_player_in') as HTMLInputElement).placeholder = lang_file['search'];
}

async function swapLang(lang="fr") {
  const file = await fetch(`/assets/locales/${lang}/translation.json`);
  lang_file = await file.json();
  console.log("OUI"+ lang_file);
}

