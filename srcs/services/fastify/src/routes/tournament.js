import Fastify from 'fastify';

async function tournamentRoute (fastify, options) {
    let tournaments = [];
    const TOURNAMENT_SIZE = 8;

    let tournamentId = Object.keys(tournaments).length;
    
    function addTournament(tournaments, newT, tournamentId){
        tournaments[tournamentId] = newT;
    };
    
    //Securising all tournaments routes :
    fastify.addHook('preValidation', async (request, reply) => {
        if (request.routerPath === '/tournaments' && (request.query.username === null || request.query.username === undefined)) {
            reply.code(403).send('Connection rejected: missing username');
        }
        /**
        if (!isAuthentificated())
         */
    });

    function Tournament(owner, id, name) {
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.players = [owner];
    };

    function addPlayer(tournament, player) {
        if (tournament.players.length < TOURNAMENT_SIZE && !tournament.players.includes(player))
            tournament.players.push(player);
    }

    function    getAvailableTournaments(tournaments, username){
        let res = [];
        tournaments.forEach(element => {
            if (element.owner !== username && !element.players.includes(username) && element.players.length < TOURNAMENT_SIZE){
                res.push(element);
            }
        });
        return (res);
    }

    function    existsTournament(tournaments, id){
        let i = 0, size = tournaments.length;
        while (i < size){
            if (tournaments[i].id == id)
                return (true);
            i++;
        }
        return (false);
    }

    /*
        Owner create a room
        Player can rejoin or leave as they want
        Once the owner start, the tournament starts (tounament will start in 3 2 1 )
    */

    //Create a tournament
    fastify.post('/tournament/create', async (request, reply) => {
        // securiser la route !!
        // ..
        try {
            tournaments[tournamentId] = new Tournament(request.body.owner, tournamentId, request.body.tournament_name);
            return {success: true, tournament : tournaments[tournamentId], tournamentId: tournamentId++};
        } catch (error) {
            console.log("error: ", error);
            return {success: false, message: error};
        }
    });



    //Join a tournament
    fastify.get('/tournament/join_:id', async (request, reply) => {
        console.log(request.query.username);
        // Checking user
        /*
        try{
            let username = request.params.body;
            if (!existsUser(username))
                throw Error("Error, no user nammed " + username);
            if (!existsTournament(tournaments, request.params.id))
                throw Error("Error, no tournament with id " + request.params.id);
        } catch (error){
            return {success: false, error: error}
        }
        */
        // securiser la route !!
        // ..
        const tournament = tournaments[request.params.id];
        //Adding user to tournament
        addPlayer(tournament, request.query.username);
        //ServerSocket.sendMsg(); // HERE to update connected clients
        return {success: true, tournament : tournament};
    });

    //Printing the list of tournaments
    fastify.get('/tournaments', async (request, reply) => {
        // securiser la route !!
        // .. Maybe on hooks YESSSS
        if (request.query.username === null || request.query.username === undefined){
            return {success: false, error: "No username provided"};
        } // useless if hook works

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
        // securiser la route !!
        // ..
        const tournament = tournaments[request.params.id];
        if (tournament === null || tournament === undefined)
            return reply.status(404).send({ error: 'Tournament not found' });
        return tournament;
    });

    //Leave a tournament

    
    //Starting the tournament

}

export default tournamentRoute;