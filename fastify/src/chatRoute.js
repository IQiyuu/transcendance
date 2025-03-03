
async function chatRoute (fastify, options) {
    fastify.addHook('preValidation', async (request, reply) => {
        console.log("connected to the chat");
        if(request.routerPath == '/chat' && !request.query.username) {
            reply.code(403).send('Connection rejected');
        }
    });

    function broadcast(message) {
        for(let client of fastify.websocketServer.clients) {
            client.send(JSON.stringify(message));
        }
    }
    fastify.register(async function(fastify) {
        fastify.get('/chat', {websocket: true}, (socket, req) => {
            // New user
            broadcast({
                sender: '__server',
                message: `${req.query.username} joined`
            });
            // Leaving user
            socket.on('close', () => {
                broadcast({
                    sender: '__server',
                    message: `${req.username} left`
                });
            });
            // Broadcast incoming message
            socket.on('message', (message) => {
                message = JSON.parse(message.toString());
                broadcast({
                    sender: req.query.username,
                    ...message
                });
            });
        });
    });
    
}

export default chatRoute;