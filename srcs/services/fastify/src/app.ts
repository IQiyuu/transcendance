import {SiteController} from "./SiteController.js";

// import * as utils from "./utils.js";

async function load_lang_file(lang="fr") {
    let lang_file;
    try {
        const file = await fetch(`/assets/locales/${lang}/translation.json`);
        if (file == null)
            throw (Error("Lang file wasnt fetched"));
        lang_file = await file.json();
        if (lang_file == null)
            throw (Error("Not parsed"));
    } catch (error) {     
        console.error("ERROR : Lang files could not be parsed, en will be set by default");
        console.log("LOG : Lang files could not be parsed, en will be set by default");
        lang_file = {
            "title" : "Trong the game",
            "username": "Username",
            "password": "Password",
            "register_text": "Register"
        }
    }
    return lang_file;
}

async function main(){
    let lang_file = await load_lang_file("en");
    let view = new SiteController(lang_file);
    
    view.add_events();

    if (await view.is_logged())
        view.connect(sessionStorage.username);

    view.print_current_page();
}

await main();

/******---------------------------------------------------------------------------------------------*******/


// function removeFriend(username) {
//     const list = document.getElementById("friendlist");
//     if (!list)
//         return ;
//     const divs = list.querySelectorAll("div");

//     divs.forEach((div) => {
//         if (div.id == `${username}_friendlist`) {
//             console.log('elem removed');
//             list.removeChild(div);
//             return ;
//         }
//     });
// }

// function addFriend(username, pp) {
//     const friendlist = document.getElementById("friendlist");
//     const div = document.createElement("div");
//     const img = document.createElement("img");
//     const span = document.createElement("span");
//     const p = document.createElement("p");
//     div.className = "w-full flex items-center justify-between p-3 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer";
//     div.id = username+"_friendlist";
//     let usname = username

//     img.src = pp;
//     img.className = "rounded-full";
//     img.style.width = "7%";

//     span.className = "flex w-3 h-3 me-3 bg-red-500 rounded-full";

//     p.className = 'text-lg';
//     p.textContent = username.length > 10 ? username.substring(0,8)+"..":username;
                
//     div.appendChild(img);
//     div.appendChild(span);
//     div.appendChild(p);

//     // afficher la popup (comme sur chesscom) d'un resume du joueur vite aif
//     div.addEventListener("contextmenu", async (event) => {
//         event.preventDefault();
    
//         // Supprimer les anciennes popups s'il y en a déjà une
//         const existing = document.getElementById("profile_window");
//         if (existing) existing.remove();
    
//         const popup = document.createElement("div");
//         const popup_img = document.createElement("img");
//         const popup_span = document.createElement("span");
//         const popup_name = document.createElement("p");
//         const add_btn = document.createElement("button");
//         const close_btn = document.createElement("button");
    
//         popup.id = "profile_window";
        
//         // positionne la ou est la souris
//         popup.classList.add("absolute");
//         popup.style.left = `${event.clientX}px`;
//         popup.style.top = `${event.clientY}px`;
//         popup.style.backgroundColor = "grey";
    
//         popup_img.src = pp;
//         popup_img.classList.add("cursor-pointer");
    
//         popup_name.textContent = usname;
    
//         add_btn.textContent = "Add Friend";
//         add_btn.classList.add("cursor-pointer");
    
//         close_btn.textContent = "×";
//         close_btn.style.color = "red";
//         close_btn.classList.add("cursor-pointer");
    
//         close_btn.addEventListener("click", () => {
//             popup.remove();
//         });
    
//         popup_img.addEventListener("click", () => {
//             display_profile(usname);
//         });

//         add_btn.addEventListener("click", () => {
//             console.log("invite a jouer");
//         });
    
//         popup.appendChild(close_btn);
//         popup.appendChild(popup_img);
//         popup.appendChild(popup_span);
//         popup.appendChild(popup_name);
//         popup.appendChild(add_btn);
    
//         document.body.appendChild(popup);
//     });
    

//     friendlist.appendChild(div);
// }

// async function initFriendlist() {
//     try {
//         const response = await fetch(`/db/friends/friendlist/${_username}`, {
//             method: "GET",
//         });

//         const data = await response.json();

//         if (!data.success) {
//             console.log("error: ", data);
//         } else {
//             // console.log(data);
//             for (let user of data.friends) {
//                 addFriend(user.username, user.pp);
//             }
//         }
//     } catch (error) {
//         console.log("error: ", error);
//     }
// }


// // croix du changement de photo de profile
// document.getElementById("profile_cross").addEventListener("click", async (event) => {
//     event.preventDefault();
//     document.getElementById("profile_picture_overlay").classList.replace("flex", "hidden");
//     (document.getElementById("previsu_picture") as HTMLImageElement).src = "";
//     (document.getElementById("file_input") as HTMLInputElement).value = "";
// });

// // echape du changement de photo de profile
// document.addEventListener("keydown", async (event) => {
//     if (!document.getElementById("profile_picture_overlay").classList.contains("hidden")) {
//         event.preventDefault();
//         if (event.key === "Escape") {
//             document.getElementById("profile_picture_overlay").classList.replace("flex", "hidden");
//             (document.getElementById("previsu_picture") as HTMLImageElement).src = "";
//             (document.getElementById("file_input") as HTMLInputElement).value = "";
//         }
//     }
// });

// // previsualiser la photo de profile selectionnee
// document.getElementById("file_input").addEventListener("change", async (event) => {
//     const file = (event.target as HTMLInputElement).files[0];
//     const previsuImage = document.getElementById("previsu_picture") as HTMLImageElement;
//     if (file) {
//         const reader = new FileReader();
        
//         reader.onload = function(e) {
//             previsuImage.src = e.target.result as string;
//         };
        
//         reader.readAsDataURL(file);
//     }
// });

// // upload une photo de profile avec le boutton
// document.getElementById("upload_btn").addEventListener("click", async (event) => {
//     event.preventDefault();

//     const formData = new FormData();
//     const fileInput = document.getElementById('file_input') as HTMLInputElement;
//     if (fileInput.files[0]) {
//         formData.append('file', fileInput.files[0]);
//         try {
//             const response = await fetch(`/upload/picture/${_username}`, {
//                 method: 'POST',
//                 body: formData,
//             });
//             if (!response.ok)
//                 console.log("error in file upload.");
//             else {
//                 console.log("file uploaded.");
//                 document.getElementById("profile_picture_overlay").classList.replace("flex", "hidden");
//                 (document.getElementById("previsu_picture") as HTMLImageElement).src = "";
//                 (document.getElementById("file_input") as HTMLInputElement).value = "";
//                 pp.src = "assets/imgs/" + _username + ".jpg?" + new Date().getTime();
//             }
//         } catch (error) {
//           console.error("error: ", error);
//         }
//       } else {
//         console.log("No file selected.");
//       }
// });

// document.getElementById("profile_username").addEventListener("click", async (event) => {
//     event.preventDefault();

//     document.getElementById("profile_picture_overlay").classList.replace("hidden", "flex");
// });

// // document.getElementById("username_btn").addEventListener("click", async (event) => {
// //     event.preventDefault();

// //     const newusername = (document.getElementById("username_input") as HTMLInputElement).value;
// //     console.log(newusername);
// //     const body = {
// //         username: _username,
// //         newusername: newusername
// //     };
// //     console.log(JSON.stringify(body));
// //     if (newusername != "") {
// //         try {
// //             const response = await fetch(`/upload/username/${_username}`, {
// //                 method: 'POST',
// //                 headers: { "Content-Type": "application/json" },
// //                 body: JSON.stringify(body),
// //             });
// //             if (!response.ok)
// //                 console.log("error in username upload.");
// //             else {
// //                 console.log("username uploaded.");
// //                 document.getElementById("profile_username_overlay").style.display = "none";
// //                 _username = newusername;
// //                 display_profile(_username);
// //             }
// //         } catch (error) {
// //           console.error("error: ", error);
// //         }
// //     }
// // });

// document.getElementById("friend_btn").addEventListener("click", async (event) => {
//     const friend_uname = document.getElementById("profile_username").textContent;
//     const body = {
//         user: _username,
//         friend: friend_uname,
//     }

//     console.log("body: ", body);

//     const friend_req = await fetch(`/db/friends/update`, {
//         method: 'POST',
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//     });

//     const data = await friend_req.json();
//     console.log("reponse du server: ", data);
//     if (data.success) {
//         document.getElementById("friend_btn").textContent = lang_file[data.message];
//         if (data.status == "accepted") {
//             try {
//                 const friend = data.friend;
//                 const me = data.user;
//                 addFriend(friend.username, friend.pp);
//                 _ws.send(JSON.stringify({
//                     type: "addFriend",
//                     user: me.username,
//                     pp: me.pp,
//                     target: friend.username,
//                 }));
//             } catch (error) {

//                 console.log("error: " + error);
//             }
//         } else if (data.status == null) {
//             removeFriend(friend_uname)
//             _ws.send(JSON.stringify({
//                 type: "removeFriend",
//                 user: _username,
//                 target: friend_uname,
//             }));
//         }
//     }
//     else
//         console.log("errorr: ", data.error);
// });


// document.getElementById("block_btn").addEventListener("click", async (event) => {
//     const toBlock = document.getElementById("profile_username").textContent;
//     const body = {
//         user: _username,
//         friend: toBlock,
//     }

//     // console.log("body: ", body);

//     const friend_req = await fetch(`/db/friends/block`, {
//         method: 'POST',
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//     });

//     const data = await friend_req.json();
//     // console.log(data);
//     if (data.success) {
//         document.getElementById("block_btn").textContent = data.blocking ? "🔓" : "🔒";
//         document.getElementById("friend_btn").textContent = data.blocking ? lang_file["send_yblock"] : lang_file["send_inv"];
//         if (data.blocking) {
//             _ws.send(JSON.stringify({
//                 type: "removeFriend",
//                 user: _username,
//                 target: toBlock,
//             }));
//             removeFriend(toBlock);
//         }
//     }
//     else
//         console.log("error: ", data.error);
// });
