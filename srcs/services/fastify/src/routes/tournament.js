import Fastify from 'fastify';

async function tournamentRoute (fastify, options) {
    let tournaments = {};
    const TOURNAMENT_SIZE = 8;

    const tournamentId = Object.keys(tournaments).length;
    
    function addTournament(tournaments, newT, tournamentId){
        tournaments[tournamentId] = newT;
    };
    
    function createTournament(owner, id, name) {
        console.log("Creating a tournament")
        newT = {
            id : id,
            name : name,
            owner : owner,
            players : {owner}
        };
        return (newT)
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

    //Create a tournament
    

    //Join a tournament


    //Leave a tournament

    
    //Starting the tournament

}

export default tournamentRoute;