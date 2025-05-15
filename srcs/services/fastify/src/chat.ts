let _ws = null;

function init() {
    // Se connecter a la socket
    const promise1 = async () => {
        return new Promise(resolve => {
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
                resolve("Ok");
            });
        });
    }



    // quand on est connecte ajouter les events pour envoyer des message (entrer et click sur le boutton)
    promise1().then((value) => {
        // document.getElementById('chat').addEventListener("keydown", (event) => { 
        //     if(event.key == 'Enter') {
        //         const input = (event.target as HTMLInputElement);
        //         if (input.value.includes("<") || input.value.includes(">") || input.value.length > 128) {
        //             input.value = '';
        //             return ;
        //         }
        //         console.log(input.value);
        //         _ws.send(JSON.stringify({
        //             message: input.value,
        //             username: _username
        //         }));
        //         input.value = '';
        //     }
        // });
        // document.getElementById('send_message').addEventListener("click", (event) => { 
        //     event.preventDefault();
        //     const input = document.getElementById("message_input") as HTMLInputElement;
        //     if (input.value.includes("<") || input.value.includes(">") || input.value.length > 128) {
        //         input.value = '';
        //         return ;
        //     }
        //     console.log(input.value);
        //     _ws.send(JSON.stringify({
        //         message: input.value,
        //         username: _username
        //     }));
        //     input.value = '';
        // });
    });
}
