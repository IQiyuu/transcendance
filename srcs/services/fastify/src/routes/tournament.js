import Fastify from 'fastify';
// import {} from './webSocketRoute.js';

const TOURNAMENT_SIZE = 8;

class Tournament{

    constructor(owner, id, name){
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.players = []; // {username, socket}
        this.readyToStart = false;
    }

    getId(){
        return (this.id);
    }

    getOwner(){
        return (this.owner);
    }

    getSize(){
        return (this.players.length);
    }

    isFull(){
        return (this.players.length >= TOURNAMENT_SIZE);
    }

    // Tournament is ready to start if at least three players are there, and all present players are connected to their server socket.
    isReadyToStart(){
        if (this.players.length < 3)
            return (false);
        let i = 0, len = this.players.length;
        while (i < len){
            if (this.players[i].socket === null)
                return (false);
        }
        return (true);
    }

    hasNextRound(){
        return (false);
    }

    currentRoundIsFinished(){
        return (false);
    }

    isFinished(){
        return (false);
    }

    addPlayer(player) {
        if (!this.isFull() && !this.contains(player))
            this.players.push({username: player, socket: null});
        if (this.players.length >= 3)
            this.isReadyToStart = true;
    }

    removePlayer(player){
        if (this.contains(player)){
            let pos = this.players.indexOf(player);
            this.players.copyWithin(pos, pos + 1);
            this.players.pop();
        }
        if (this.players.length < 3)
            this.isReadyToStart = false;
    }

    connectPlayer(player, socket){
        let pos = this.players.indexOf(player);
        this.players.forEach(tuple => {
            if (tuple.username === player){
                tuple.socket = socket;
            }
        })
    }

    disconnectPlayer(player){
        this.players.forEach(tuple => {
            if (tuple.username === player){
                tuple.socket.close();
                tuple.socket = null;
            }
        });
    }

    contains(player){
        let i = 0, len = this.players.length;
        while (i < len){
            if (this.players[i].username === player)
                return (true);
            i++;
        }
        return (false);
    }
};

// Check whether the player is already in a tournament
function    inTournament(tournaments, player){
    if (tournaments === null || tournaments === undefined)
        return (false);
    tournaments.forEach((t) => {
        if (t.contains(player))
            return (true);
    });
    return (false);
}

function    needAuthRoute(route){ // to recheck
    return (route === '/tournament/list'|| route === '/tournament/leave' || route === '/tournament/kick'
        || route === '/tournament/join' || route === '/tournament/start'
    );
}

async function tournamentRoute (fastify, options) {
    let tournaments = [];
    let tournamentId = Object.keys(tournaments).length;

    function addTournament(tournaments, t_id, owner, t_name){
        let t = new Tournament(owner, t_id, t_name);
        t.addPlayer(owner);
        tournaments.push(t);
    };

    //Securising all private tournaments routes :
    fastify.addHook('preValidation', async (request, reply) => {
        if (needAuthRoute(request.url) && (request.query.username === null || request.query.username === undefined)) {
            reply.code(403).send('Tournament op rejected: missing username');
        }

        if (request.url === "/tournament/kick" && (request.query.username2 === null || request.query.username2 === undefined))
            reply.code(403).send('Tournament op rejected: missing username');
        /**
        if (!isAuthentificated())
         */
    });

    //Masking data we send
    fastify.addHook('preSerialization', async (request, reply, payload) => {
        if (payload.tournament !== null && payload.tournament !== undefined){
            payload.tournament = getMasked(payload.tournament);
        }
    });

    function getMasked(t){
        let players = [];
        t.players.forEach(p =>{
            players.push(p.username);
        });

        let tournoi = {
            id : t.id,
            name : t.name,
            owner : t.owner,
            players : players,
            readyToStart : t.readyToStart
        };
        return (tournoi);
    }

    //Return all tournaments that username can join. Also mask every private info
    function    getAvailableTournaments(tournaments, username){
        let res = [];
        tournaments.forEach(t => {
            if (t.getOwner() !== username && !t.contains(username) && !t.isFull()){
                res.push(getMasked(t));
            }
        });
        return (res);
    }

    function    existsTournament(tournaments, id){
        if (tournaments === null || tournaments === undefined)
            return (false);
        let i = 0, size = tournaments.length;
        while (i < size){
            if (id == tournaments[i].getId())
                return (true);
            i++;
        }
        return (false);
    }

    //Create a tournament
    fastify.post('/tournament/create', async (request, reply) => {
        let player = request.body.owner;
        let t_name = request.body.tournament_name;
        if (inTournament(tournaments, player))
            return {success: false, message: "Player can't create a tournament as he's already in one"};
        try {
            addTournament(tournaments, tournamentId, player, t_name);
            return {success: true, tournament : tournaments[tournamentId++]};
        } catch (error) {
            console.log("error: ", error);
            return {success: false, message: error};
        }
    });

    // OnSend() ? to change if tournament, then tournament masked

    //Printing the list of tournaments
    fastify.get('/tournament/list', async (request, reply) => {
        if (request.query.username === undefined || request.query.username === null)
            return {success: false};

        try {
            let res = getAvailableTournaments(tournaments, request.query.username);
            return {success: true, tournaments: res};
        } catch (error) {
            console.log(error);
            return {success: false, message: error};
        }
    });

    //Tournament's info
    fastify.get('/tournament/:id', async (request, reply) => {
        const tournament = tournaments[request.params.id];
        if (tournament === undefined || tournament === null)
            return reply.status(404).send({ error: 'Tournament not found' });
        return {success: true, tournament: tournament};
    });
    
    // Declaring a match is over url to check
    fastify.get('/tournament/:id/match_over', async (request, reply) => {
        return {success: true};
    });

    //Join a tournament
    fastify.get('/tournament/join/:id', async (request, reply) => {
        let t_id = request.params.id;
        let player = request.query.username;

        if (!existsTournament(tournaments, t_id))
            return {success: false, error: "Tournament doesnt exists"};

        let t = tournaments[t_id];
        if (t.contains(player))
            return {success: false, error: "Player in the tournament"};

        if (t.isFull())
            return {success: false, error: "Tournament full"};

        t.addPlayer(player);

        //ServerSocket.sendMsg(); // HERE to update connected clients
        return {success: true, tournament : t};
    });

    //Leave a tournament
    fastify.get('/tournament/leave/:id', async (request, reply) => {
        let t_id = request.params.id;
        let user = request.query.username;
        if (!existsTournament(tournaments, t_id))
            return {success: false, error: "Tournament doesnt exists"};
        let t = tournaments[t_id];
        if (!t.contains(user))
            return {success: false, error: "Player not in the tournament"};
        if (user === t.getOwner() && t.getSize() > 1)
            return {success: false, error: "Owner can't leave the room while other players are present"};
        
        t.removePlayer(user);
        // sock.updateTournamentPlayers(t);
        return {success: true};
    });
    
    //disband ? kick every player then leave
    fastify.get('/tournament/kick/:id', async(request, reply) => {
        let t_id = request.params.id;
        let owner = request.query.username;
        let user = request.query.username2;

        if (!existsTournament(tournaments, t_id))
            return {success: false, error: "Tournament doesnt exists"};
        
        let t = tournaments[t_id];
        if (owner !== t.getOwner())
            return {success: false, error: "You are not the owner"};

        if (!t.contains(user))
            return {success: false, error: "Player not in the tournament"};

        t.removePlayer(user);
        // sock.updateTournamentPlayers(t);
        return {success: true};
    })

    //Starting the tournament
    fastify.get('/tournament/start/:id', async(request, reply) => {
        let t_id = request.params.id;
        let player = request.query.username;

        if (!existsTournament(tournaments, t_id))
            return {success: false, error: "Tournament doesnt exists"};

        let t = tournaments[t_id];
        if (player !== t.getOwner())
            return {success: false, error: "Only owner can start tournament"};

        if (!t.isReadyToStart())
            return {success: false, error: "Not enough players to start tournament"};

        startTournament(t);
        return ({success: true});
    })

    
    fastify.get('/tournament/:id/ws', { websocket: true }, (socket, req) => {
        let username = req.query.username;
        let t_id = req.params.id;

        console.log("New socket connection !");

        //CHecking if user 
        if (username === null || username === undefined || t_id === null || t_id === undefined)
            return {success: false, error: "Need username and id"};

        if (!existsTournament(tournaments, t_id))
            return {success: false, error: "Tournament doesnt exists"};

        let t = tournaments[t_id];
        if (!t.contains(username))
            return {success: false, error: "Player not in this tournament"};


        socket.on('message', message => {
            console.log(message);
        });

        socket.on("close", () => {
            t.disconnectPlayer(username, socket);
        });

        t.connectPlayer(username, socket);
    });

    setInterval(() => {
        tournaments.forEach(tournament => {
            if (tournament.isReadyToStart()){
                tournament.start();
            }
            // if (tournament.hasNextRound() && tournament.currentRoundIsFinished())
            //     tournament.startNextRound();
            // if (tournament.isFinished())
            //     tournament.end();
        });
    }, 30);
}

export default tournamentRoute;