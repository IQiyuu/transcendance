let _ws = null;

async function init() {
    // Se connecter a la socket
    await swapLang("fr");
    updateContent();
    _ws = new WebSocket(`wss://${window.location.host}/ws?username=${_username}`);
    console.log(_username);
    _ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        console.log("recu ", data.user);
        // appendMessage(message);
        if (data.type == "connection") {
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
            addFriend(data.user, data.pp);
        } else if (data.type == "removeFriend") {
            removeFriend(data.user);
        } else if (data.type == "matchmaking") {
            if (data.state == "found") {
                stopMatchmakingAnimation();
                _role = data.role;
                _gameId = data.gameId;
                console.log("game starting ", _gameId);
                startGame(data.opponent, _ws, false);
            }
        }
    };

    if (_ws && _ws.readyState === WebSocket.CLOSING) {
        _ws.close(JSON.stringify({
            gameId:_gameId,
            mod: _mod,
            uname: _username}));
    }

    _ws.addEventListener("open", event => {
        console.log("Connected to WS server!");
    });
};

init();