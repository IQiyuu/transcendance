let _ws = null;
let _username = sessionStorage.username;

function init() {
    // Se connecter a la socket du server (wss secu)
    const promise1 = async () => {
        return new Promise( resolve => {
            _ws = new WebSocket(`wss://${window.location.host}/chat?username=${_username}`);
            // Quand un message est recu
            _ws.onmessage = (message) => {
                message = JSON.parse(message.data);
                console.log("recu ", message);
                appendMessage(message);
            };
            _ws.addEventListener("open", event => {
                console.log("Connected to WS server!");
                resolve("Ok");
            });
        });
    }
    // ajouter un message dans la chatbox
    function appendMessage(message) {
        const chatbox = document.getElementById('chatbox');
        chatbox.innerHTML +=
        `
        <div id="message">
            <b>${message.sender}:&nbsp;</b>
            ${message.message}
        </div>
        `
        chatbox.scrollBy(0,25);
    }

    // quand on est connecte ajouter les events pour envoyer des message (entrer et click sur le boutton)
    promise1().then((value) => {
        document.getElementById('chat').addEventListener("keydown", (event) => { 
            if(event.key == 'Enter') {
                const input = (event.target as HTMLInputElement);
                if (input.value.includes("<") || input.value.includes(">") || input.value.length > 128) {
                    input.value = '';
                    return ;
                }
                console.log(input.value);
                _ws.send(JSON.stringify({
                    message: input.value,
                    username: _username
                }));
                input.value = '';
            }
        });
        document.getElementById('send_message').addEventListener("click", (event) => { 
            event.preventDefault();
            const input = document.getElementById("message_input") as HTMLInputElement;
            if (input.value.includes("<") || input.value.includes(">") || input.value.length > 128) {
                input.value = '';
                return ;
            }
            console.log(input.value);
            _ws.send(JSON.stringify({
                message: input.value,
                username: _username
            }));
            input.value = '';
        });
    });
}