import Fastify from 'fastify';

async function tournamentRoute (fastify, options) {
    let tournaments = {};
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
        return (newT);
    };

    function addPlayer(tournament, player) {
        if (tournament.players.length < TOURNAMENT_SIZE)
            tournament.players.append(player);
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
            // createTournament
            return {success: true};
        } catch (error) {
            console.log("error: ", error);
            return (reply.code(500).send({success: false, message: error}));
        }
    });
    //Create a tournament
    

    //Join a tournament


    //Leave a tournament

    
    //Starting the tournament

}

export default tournamentRoute;