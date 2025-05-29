import Fastify from 'fastify';

async function tournamentRoute (fastify, options) {
    let tournaments = [];
    const TOURNAMENT_SIZE = 8;

    const tournamentId = Object.keys(tournaments).length;
    
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

    fastify.post('/tournament', async (request, reply) => {
        console.log(request);
        console.log("--------------");
        console.log(reply);
        try {
            tournaments[tournamentId] = new Tournament(request.body.owner, tournamentId, request.body.tournament_name);
            return (reply.code(201).send({success: true}));
        } catch (error) {
            console.log("error: ", error);
            return (reply.code(500).send({success: false, message: error}));
        }
    });
    //Create a tournament
    

    //Join a tournament

    //Printing the list of tournaments
    fastify.get('/tournaments', async (request, reply) => {
        try {
            let res = getAvailableTournaments(tournaments);
            return (reply.send({tournaments: res}));
        } catch (error) {
            console.log(error);
            return (reply.code(500).send({success: false, message: error}));
        }
    });


    //Leave a tournament

    
    //Starting the tournament

}

export default tournamentRoute;