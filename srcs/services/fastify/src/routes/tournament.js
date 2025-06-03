import Fastify from 'fastify';
// import {} from './webSocketRoute.js';

const TOURNAMENT_SIZE = 8;

class Tournament{

    constructor(owner, id, name){
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.players = [owner];
        this.readyToStart = false;
    }

    getId(){
        return (this.id);
    }

    getOwner(){
        return (this.owner);
    }

    isFull(){
        return (this.players.length >= TOURNAMENT_SIZE);
    }

    isReadyToStart(){
        return (this.readyToStart);
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
            this.players.push(player);
        if (this.players.length >= 3)
            this.isReadyToStart = true;
    }

    removePlayer(player){
        if (this.contains(player)){
            console.log("Before removing :", this.players);
            let pos = this.players.indexOf(player);
            this.players.copyWithin(pos, pos + 1);
            this.players.pop();
            console.log("After removing :", this.players);
        }
        if (this.players.length < 3)
            this.isReadyToStart = false;
    }
    contains(player){
        return (this.players.includes(player));
    }

    start(){

    }

    end(){

    }
};

function    inTournament(tournaments, player){
    if (tournaments === null || tournaments === undefined)
        return (false);
    console.log("testing");
    tournaments.forEach((t) => {
        if (t.contains(player))
            return (true);
    });
    return (false);
}

function needAuthRoute(route){ // to recheck
    return (route === '/tournament/list'|| route === '/tournament/leave' || route === '/tournament/kick'
        || route === '/tournament/join' || route === '/tournament/start'
    );
}

async function tournamentRoute (fastify, options) {
    let tournaments = [];
    let tournamentId = Object.keys(tournaments).length;
    
    function addTournament(tournaments, t_id, owner, t_name){
        tournaments.push(new Tournament(owner, t_id, t_name));
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

    //Return all tournaments that username can join
    function    getAvailableTournaments(tournaments, username){
        let res = [];
        tournaments.forEach(t => {
            if (t.getOwner() !== username && !t.contains(username) && !t.isFull()){
                res.push(element);
            }
        });
        return (res);
    }

    function    existsTournament(tournaments, id){
        if (tournaments === null || tournaments === undefined)
            return (false);

        tournaments.forEach((t) => {
            if (t.getId() === id)
                return (true);
        });
        return (false);
    }

    //Create a tournament
    fastify.post('/tournament/create', async (request, reply) => {
        // verification du form ?

        let player = request.body.username;
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
    
    //Printing the list of tournaments
    // Public route ?
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
    // Public route ?
    fastify.get('/tournament/:id', async (request, reply) => {
        const tournament = tournaments[request.params.id];
        if (tournament === undefined || tournament === null)
            return reply.status(404).send({ error: 'Tournament not found' });
        return {success: true, tournament: tournament};
    });
    
    // Declaring a match is over
    fastify.get('/tournament/:id/match_over', async (request, reply) => {
        return ({success: true});
    });

    //Join a tournament
    fastify.get('/tournament/join/:id', async (request, reply) => {
        let t_id = request.params.id;
        let player = request.query.username;

        if (!existsTournament(tournaments, t_id))
            return {success: false, error: "Tournament doesnt exists"};
        
        let t = tournaments[t_id];
        if (!t.contains(player))
            return {success: false, error: "Player not in the tournament"};

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
            return {success: false, error: "Tournament doesnt exists"}
        
        let t = tournaments[t_id];
        if (!inTournament(t, user))
            return {success: false, error: "Player not in the tournament"}
        
        if (user === t.getOwner() && t.getSize() > 1)
            return {success: false, error: "Owner can't leave the room while other players are present"}
        
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

        t.start();
        return ({success: true});
    })

    // setInterval(() => {
    //     Object.values(tournaments).forEach(tournament => {
    //         // if (tournament.isReadyToStart()){
    //         //     tournament.start();
    //         // }
    //         if (tournament.hasNextRound() && tournament.currentRoundIsFinished())
    //             tournament.startNextRound();
    //         if (tournament.isFinished())
    //             tournament.end();
    //     });
    // }, 30);
}

export default tournamentRoute;