import Fastify from 'fastify';

async function tournamentRoute (fastify, options) {
    let tournaments = [];
    const TOURNAMENT_SIZE = 8;

    let tournamentId = Object.keys(tournaments).length;
    
    function addTournament(tournaments, newT, tournamentId){
        tournaments[tournamentId] = newT;
    };
    
    function Tournament(owner, id, name) {
        console.log("Creating a tournament")
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.players = [owner];
    };

    function addPlayer(tournament, player) {
        if (tournament.players.length < TOURNAMENT_SIZE)
            tournament.players.append(player);
    }

    function    getAvailableTournaments(tournaments, username){

        return (tournaments);
    }

    /*
        Owner create a room
        Player can rejoin or leave as they want
        Once the owner start, the tournament starts (tounament will start in 3 2 1 )
    */

    //Create a tournament
    fastify.post('/tournament', async (request, reply) => {
        try {
            tournaments[tournamentId] = new Tournament(request.body.owner, tournamentId, request.body.tournament_name);
            tournamentId++;
            return {success: true};
        } catch (error) {
            console.log("error: ", error);
            return {success: false, message: error};
        }
    });


    //Join a tournament
    fastify.get('/tournament/join_:id', async (request, reply) => {
        // Checking user

        // Checking tournament
        const tournament = tournaments[request.params.id];

        //Adding user to tournament

        //returning the tournament info
        return tournament;
    });

    //Printing the list of tournaments
    fastify.get('/tournaments', async (request, reply) => {
        // VERIFIER SI l'USER EST AUTHENTIFIER
        try {
            let res = getAvailableTournaments(tournaments);
            return {success: true, tournaments: tournaments};
        } catch (error) {
            console.log(error);
            return {success: false, message: error};
        }
    });

    //Tournament's info
    fastify.get('/tournament/:id', async (request, reply) => {
        const tournament = tournaments[request.params.id];
        if (!tournament) return reply.status(404).send({ error: 'Tournament not found' });
        return tournament;
    });

    //Leave a tournament

    
    //Starting the tournament

}

export default tournamentRoute;