var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("form");
    var formTitle = document.getElementById("form-title");
    var registerLink = document.getElementById("register-view");
    var logginBtn = document.getElementById("login_btn");
    var isRegisterMode = false;
    // swap entre connexion et inscription
    registerLink.addEventListener("click", function (event) {
        event.preventDefault();
        isRegisterMode = !isRegisterMode;
        if (isRegisterMode) {
            formTitle.textContent = "Inscription";
            registerLink.textContent = "Se connecter";
            logginBtn.textContent = "Register";
        }
        else {
            formTitle.textContent = "Connexion";
            registerLink.textContent = "Register";
            logginBtn.textContent = "Se connecter";
        }
    });
    // formulaire de connexion / inscription
    form.addEventListener("submit", function (event) { return __awaiter(_this, void 0, void 0, function () {
        var username, password, url, body, response, data, loginForm, pongGame, error, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    username = document.getElementById("username");
                    password = document.getElementById("password");
                    url = isRegisterMode ? "/register" : "/login";
                    body = {
                        username: username.value,
                        password: password.value,
                    };
                    console.log("Envoi vers ".concat(url), body);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(url, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    console.log("Réponse du serveur :", data);
                    if (data.success) {
                        sessionStorage.setItem('username', data.username);
                        sessionStorage.setItem('userId', data.id);
                        loginForm = document.getElementById("login-form");
                        pongGame = document.getElementById("site");
                        loginForm.style.display = "none";
                        pongGame.style.display = "flex";
                        init();
                        fillCanvas();
                    }
                    else {
                        error = document.getElementById("errorAuth");
                        error.textContent = data.message;
                        error.style.display = "block";
                        console.log("Auth error");
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("error ", error_1);
                    alert("Une erreur est survenue.");
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
});
// check si l'utilisateur est connecte
function checkIfLoggedIn() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/protected', {
                            method: 'GET',
                            credentials: 'include',
                        })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (response.ok && data.success) {
                        sessionStorage.setItem('username', data.username);
                        sessionStorage.setItem('userId', data.id);
                        _username = data.username;
                        console.log('Utilisateur connecté:', data.username);
                        init();
                        return [2 /*return*/, true];
                    }
                    else {
                        console.log('Utilisateur non connecté');
                        return [2 /*return*/, false];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Erreur lors de la vérification de la connexion:', error_2);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// choisit l'affichage en fonction de l'utilisateur (connecte ou non)
checkIfLoggedIn().then(function (isLoggedIn) {
    var loginForm = document.getElementById("login-form");
    var pongGame = document.getElementById("site");
    if (isLoggedIn)
        pongGame.style.display = "block";
    else
        loginForm.style.display = "block";
});
// GET et afficher les infos du profile / historique
function display_profile(username) {
    return __awaiter(this, void 0, void 0, function () {
        var list, menu, profile_req, profile_1, histo_req, data, cpt, w, error_3;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    list = document.getElementById("histo_list");
                    menu = document.getElementById("menu");
                    menu.style.display = "none";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("/profile/".concat(username), {
                            method: 'GET',
                            credentials: 'include',
                            headers: { "Content-Type": "application/json" },
                        })];
                case 2:
                    profile_req = _a.sent();
                    return [4 /*yield*/, profile_req.json()];
                case 3:
                    profile_1 = _a.sent();
                    if (!profile_1.datas) {
                        console.log("player not found.");
                        return [2 /*return*/];
                    }
                    document.getElementById("profile_picture").src = profile_1.datas.picture_path + "?" + new Date().getTime();
                    document.getElementById("profile_username").innerText = profile_1.datas.username;
                    document.getElementById("profile_creation").innerText = "member since: ".concat(profile_1.datas.created_at);
                    return [4 /*yield*/, fetch("/historic/".concat(username), {
                            method: 'GET',
                            credentials: 'include',
                            headers: { "Content-Type": "application/json" },
                        })];
                case 4:
                    histo_req = _a.sent();
                    return [4 /*yield*/, histo_req.json()];
                case 5:
                    data = _a.sent();
                    console.log(data);
                    list.replaceChildren();
                    // affiche l'historique
                    if (data.success) {
                        cpt = 0;
                        w = 0;
                        ;
                        data.datas.forEach(function (item) {
                            cpt++;
                            if (cpt < 20) {
                                var li = document.createElement("li");
                                var a = document.createElement("a");
                                a.innerText = item.winner_username;
                                a.style.color = "blue";
                                a.href = "#";
                                a.id = "profileDisplay";
                                var a2 = document.createElement("a");
                                a2.innerText = item.loser_username;
                                a2.style.color = "blue";
                                a2.href = "#";
                                a2.id = "profileDisplay";
                                li.appendChild(a);
                                li.innerHTML += ": 11 VS ";
                                li.appendChild(a2);
                                li.innerHTML += " : " + item.loser_score + " at " + item.created_at;
                                list.appendChild(li);
                                li.style.fontSize = "16px";
                            }
                            if (item.winner_username == profile_1.datas.username)
                                w++;
                        });
                        document.getElementById("winrate").innerHTML = "".concat(cpt, " games (").concat(w, "/").concat(cpt - w, ")");
                    }
                    // change les a (lien) de l'historique par des liens qui menent a la page de profile
                    document.querySelectorAll("a#profileDisplay").forEach(function (item) {
                        item.addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        event.preventDefault();
                                        return [4 /*yield*/, display_profile(item.textContent)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    document.getElementById("player_profile").style.display = "block";
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    menu.style.display = "flex";
                    console.log("error fetching db: ", error_3);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// afficher le profile
document.getElementById("profile_button").addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, display_profile(_username)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// afficher le menu du jeu
function displayMenu() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            document.getElementById("menu").style.display = "flex";
            document.getElementById("player_profile").style.display = "none";
            fillCanvas();
            document.getElementById("scoreboard").style.display = "none";
            return [2 /*return*/];
        });
    });
}
// retourner au menu
document.getElementById("game_title").addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("back to menu");
                return [4 /*yield*/, displayMenu()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// input recherche de joueur
document.getElementById("search_player_in").addEventListener("keydown", function (event) { return __awaiter(_this, void 0, void 0, function () {
    var input;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(event.key == 'Enter')) return [3 /*break*/, 2];
                input = event.target;
                return [4 /*yield*/, display_profile(input.value)];
            case 1:
                _a.sent();
                input.value = "";
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
// button recherche de joueur
document.getElementById("search_player_btn").addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () {
    var input;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                event.preventDefault();
                input = (document.getElementById("search_player_in"));
                return [4 /*yield*/, display_profile(input.value)];
            case 1:
                _a.sent();
                input.value = "";
                return [2 /*return*/];
        }
    });
}); });
var pp = document.getElementById("profile_picture");
var ci = document.getElementById("camera_icon");
// clique sur la photo de profile
pp.addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () {
    var user_page;
    return __generator(this, function (_a) {
        user_page = document.getElementById("profile_username").textContent;
        if (user_page == _username) {
            document.getElementById("profile_picture_overlay").style.display = "flex";
            ci.style.opacity = "0";
        }
        return [2 /*return*/];
    });
}); });
// clique sur la photo de profile
ci.addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () {
    var user_page;
    return __generator(this, function (_a) {
        user_page = document.getElementById("profile_username").textContent;
        if (user_page == _username) {
            ci.style.opacity = "0";
            document.getElementById("profile_picture_overlay").style.display = "flex";
        }
        return [2 /*return*/];
    });
}); });
// hover sur la photo de profile
pp.addEventListener('mouseout', function () {
    var user_page = document.getElementById("profile_username").textContent;
    if (user_page == _username)
        ci.style.opacity = "0";
});
pp.addEventListener("mouseover", function (event) { return __awaiter(_this, void 0, void 0, function () {
    var user_page;
    return __generator(this, function (_a) {
        user_page = document.getElementById("profile_username").textContent;
        if (user_page == _username)
            ci.style.opacity = "0.6";
        return [2 /*return*/];
    });
}); });
ci.addEventListener("mouseover", function (event) { return __awaiter(_this, void 0, void 0, function () {
    var user_page;
    return __generator(this, function (_a) {
        user_page = document.getElementById("profile_username").textContent;
        if (user_page == _username)
            ci.style.opacity = "0.6";
        return [2 /*return*/];
    });
}); });
// croix du changement de photo de profile
document.getElementById("profile_cross").addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        event.preventDefault();
        document.getElementById("profile_picture_overlay").style.display = "none";
        document.getElementById("previsu_picture").src = "";
        document.getElementById("file_input").value = "";
        return [2 /*return*/];
    });
}); });
// echape du changement de photo de profile
document.addEventListener("keydown", function (event) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (document.getElementById("profile_picture_overlay").style.display !== "none") {
            event.preventDefault();
            if (event.key === "Escape") {
                document.getElementById("profile_picture_overlay").style.display = "none";
                document.getElementById("previsu_picture").src = "";
                document.getElementById("file_input").value = "";
            }
        }
        return [2 /*return*/];
    });
}); });
// previsualiser la photo de profile selectionnee
document.getElementById("file_input").addEventListener("change", function (event) { return __awaiter(_this, void 0, void 0, function () {
    var file, previsuImage, reader;
    return __generator(this, function (_a) {
        file = event.target.files[0];
        previsuImage = document.getElementById("previsu_picture");
        if (file) {
            reader = new FileReader();
            reader.onload = function (e) {
                previsuImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
        return [2 /*return*/];
    });
}); });
// upload une photo de profile avec le boutton
document.getElementById("upload_btn").addEventListener("click", function (event) { return __awaiter(_this, void 0, void 0, function () {
    var formData, fileInput, response, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                event.preventDefault();
                formData = new FormData();
                fileInput = document.getElementById('file_input');
                if (!fileInput.files[0]) return [3 /*break*/, 5];
                formData.append('file', fileInput.files[0]);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fetch("/upload/".concat(_username), {
                        method: 'POST',
                        body: formData,
                    })];
            case 2:
                response = _a.sent();
                if (!response.ok)
                    console.log("error in file upload.");
                else {
                    console.log("file uploaded.");
                    document.getElementById("profile_picture_overlay").style.display = "none";
                    document.getElementById("previsu_picture").src = "";
                    document.getElementById("file_input").value = "";
                    pp.src = "imgs/" + _username + ".jpg?" + new Date().getTime();
                }
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                console.error("error: ", error_4);
                return [3 /*break*/, 4];
            case 4: return [3 /*break*/, 6];
            case 5:
                console.log("No file selected.");
                _a.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}); });
