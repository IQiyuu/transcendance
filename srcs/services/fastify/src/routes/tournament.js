import Fastify from 'fastify';

import * as gameRoute from "./gameRoute.js";

const TOURNAMENT_SIZE = 8;

//To put in utils.js
function randomIntFromInterval(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

// Return a random partition of order for a tournament bracket
function    initBracket(size){
	let nbs = [];
	let x;
	let i = 0;
	while (i < size){
		x = randomIntFromInterval(1, size);
		// console.log("random number generated : " + x.toString());
		if (!nbs.includes(x)){
			nbs.push(x);
			i++;
		}
	}
	return (nbs);
}

function    calculateNbBrackets(nb_p){
	let x = Math.round(Math.log2(nb_p));
	return (2 ** x < nb_p ? x + 1 : x);
}

// States used for the tournament itself and it's games
const T_STARTING = 0;
const T_READY = 1;
const T_ON_GOING = 2;
const T_FINISHED = 3;

function Player(username, socket){
	this.username = username;
	this.socket = socket;
}

class Tournament{
	current_round = 0;
	// match : {game_id, players, state, res}
	
	constructor(owner, id, name){
		this.id = id;
		this.name = name;
		this.owner = owner;
		this.players = []; // Objects : {username, socket}
		// Is a map for players better ?
		this.brackets = []; // Ordered array of ordered array of Objects : {game_id, players(p1, p2), state(STARTING || ON GOING || FINISHED), winner}
		this.state = T_STARTING;
	}
	
	getId(){
		return (this.id);
	}
	
	getOwner(){
		return (this.owner);
	}
	
	getPlayers(){
		return (this.players);
	}
	
	getSize(){
		return (this.players.length);
	}
	
	getState(){
		return (this.state);
	}
	
	isFull(){
		return (this.players.length >= TOURNAMENT_SIZE);
	}
	
	getMatch(game_id){
		for (let i = 0 ; i < this.brackets[this.current_round].length ; i++){
			if (this.brackets[this.current_round][i]?.game_id === game_id)
				return (this.brackets[this.current_round][i].game_id);
		}
		return (undefined);
	}

	// Tournament is ready to start if at least three players are there, and all present players are connected to their server socket.
	isReadyToStart(){
		if (this.players.length < 3)
			return (false);
		let i = 0, len = this.players.length;
		while (i < len){
			if (this.players[i].socket === null)
				return (false);
			i++;
		}
		return (true);
	}
	
	currentRoundIsFinished(){
		if (this.state === T_STARTING)
			return (false);
		for (let i = 0 ; i < this.brackets[this.current_round].length ; i++){
			if (this.brackets[this.current_round][i].state !== T_FINISHED)
				return (false);
		}
		return (true);
	}
	
	// Tell whether the current round can be started
	isRoundReadyToStart(){
		let round = this.brackets[this.current_round];
		if (round === null || round === undefined)
			return (false);
		for (let i = 0 ; i < round.length ; i++){
			if (round[i].state !== T_READY){
				return (false);
			}
		}
		return (true);
	}
	
	isFinished(){
		return (this.state === T_FINISHED);
	}
	
	addPlayer(username) {
		if (!this.isFull() && !this.contains(username))
			this.players.push(new Player(username, null));
	}
	
	// Remove a player from the tournament. Also close the socket if it exists
	removePlayer(username){
		// console.log("Trying to remove ");
		// console.log(username);
		// console.log(this.players);
		let pos = -1;
		this.players.forEach(player => {
			if (player.username == username){
				pos = this.players.indexOf(player);
			}
		});
		if (pos === -1){
			console.log("Error");
			return ;
		}
		if (this.players[pos].socket !== null){
			this.players[pos].socket.close();
		}
		this.players.splice(pos, 1);
	}
	
	//Set the socket for a player
	connectPlayer(username, socket){
		this.players.forEach(player => {
			if (player.username === username){
				player.socket = socket;
			}
		});
	}
	
	//Close the socket for a player
	disconnectPlayer(username){
		this.players.forEach(player => {
			if (player.username === username){
				if (player.socket !== null)
					player.socket.close();
				player.socket = null;
			}
		});
	}
	
	contains(username){
		let i = 0, len = this.players.length;
		while (i < len){
			if (this.players[i].username === username)
				return (true);
			i++;
		}
		return (false);
	}
	
	/**
	* Initialize the first round
	* Each player has a random position given
	*/
	startTournament(){
		// console.log("Starting tournament");
		this.state = T_ON_GOING;
		// console.log("Tournament will start\nRandom pos are :");
		this.brackets.length = calculateNbBrackets(this.players.length);
		
		this.brackets[0] = [];
		let bracket_pile = initBracket(this.players.length);
		let next;
		while (bracket_pile.length > 0){
			next = bracket_pile.pop();
			let p1 = this.players[next - 1];
			if (bracket_pile.length === 0){
				this.brackets[0].push({game_id : -1, players : [p1, null], state : T_READY, winner : null});
				break ;
			}
			// console.log(next);
			next = bracket_pile.pop();
			let p2 = this.players[next - 1];
			this.brackets[0].push({game_id : -1, players : [p1, p2], state : T_READY, winner : null});
		}		
		// console.log("List of matchs (to recheck with more players) :");
		// console.log(this.brackets);
	}
	
	async startRound(){
		// Create games for each user in a match
		console.log("Starting a round");
		if (this.brackets === undefined || this.brackets[this.current_round] === undefined)
			console.log("error : the round we want to start is null or undefined");
		this.brackets[this.current_round].forEach(match => {
			// console.log("Starting a tournament match !");
			// console.log(match);
			if (match.players[1] === null){
				console.log("No opponent, to impl");
				match.state = T_FINISHED;
				match.winner = match.players[0].username;
			} else {
				console.log("starting a round");
				//Create the match
				let g_id = gameRoute.createGame(match.players[0].username, match.players[1].username, this.t_id);
				let game = gameRoute.games[g_id];
				match.players[0].socket.send(JSON.stringify({
					type: "new_match",
					game_id: g_id,
					game: game // not used, only there for debugging
				}));
				
				match.players[1].socket.send(JSON.stringify({
					type: "new_match",
					game_id: g_id,
					game: game // not used, only there for debugging
				}));
				gameRoute.addPlayingClients(match.players[0], match.players[1], g_id);
				match.state = T_ON_GOING;
			}
		});
	}
	
	//
	initNextRound(){
		// Get players (winner), then adding them to the next round
	}

	// Update the tournament's current round with the ended match 
	updateRound(game){
		let	match = this.getMatch(game.id);
		if (match === undefined)
			throw (Error("No match with this game_id"));
		match.winner = (game.scores.left < game.scores.right) ? game.players.right : game.players.left;
		match.state = T_FINISHED;
		if (this.brackets[this.current_round].length === 1)
			this.state = T_FINISHED;
	}
};

// Check whether the player is already enrolled in a tournament
function    inTournament(tournaments, username){
	if (tournaments === null || tournaments === undefined)
		return (false);
	for (let i = 0; i < tournaments.length ; i++){
		if (tournaments[i].contains(username))
			return (true);
	}
	return (false);
}

function    needAuthRoute(route){ // to recheck
	return (route === '/tournament/list'|| route === '/tournament/leave' || route === '/tournament/kick'
		|| route === '/tournament/join' || route === '/tournament/start'
	);
}

// Returns a view of the tournament without sensible info
function    getMasked(t){
	let players = [];
	t.players.forEach(p =>{
		players.push(p.username);
	});
	
	let b;
	console.log(" Masking brackets:");
	// console.log(t.brackets);
	// console.log(t);
	if (t.brackets === undefined || t.brackets === null){
		b = null;
	}else {
		b = [];
		t.brackets.forEach(arr => {
			// console.log(arr);
			let round = [];
			arr.forEach(match => {
				// console.log(match);
				// console.log(match.players);
				let p2 = null;
				if (match.players[1] !== null)
					p2 = match.players[1].username;
				round.push({
					p1 : match.players[0].username,
					p2 : p2,
					state : match.state,
					winner : match.winner
				});
			});
			b.push(round);
		});
	}
	let tournoi = {
		id : t.id,
		name : t.name,
		owner : t.owner,
		players : players,
		brackets : b
	};
	return (tournoi);
}

//Return all tournaments that username can join. Also mask every private info
function    getAvailableTournaments(tournaments, username){
	let res = [];
	tournaments.forEach(t => {
		if (t.getOwner() !== username && !t.contains(username) && !t.isFull() && t.getState() === T_STARTING){
			res.push(getMasked(t));
		}
	});
	return (res);
}

function    updateTournament(tournament){
	let res = getMasked(tournament);
	console.log("Trying to update clients");
	tournament.getPlayers().forEach(player => {
		if (player.socket !== null){
			console.log("   Socket found");
			player.socket.send(JSON.stringify({
				type: "update",
				tournament: res
			}));
		}
	});
}

// Create a tournament and return it
function    addTournament(tournaments, t_id, owner, t_name){
	let t = new Tournament(owner, t_id, t_name);
	t.addPlayer(owner);
	tournaments.push(t);
	return (t);
};

function    getTournament(ts, id){
	let t = ts.find((el) => el.getId() == id);
	if (t === undefined)
		console.log("Tournament not found");
	return (t);
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

let tournaments = [];
let max_t_id = tournaments.length;

// Not used for now
export function	gameInTournament(game_id){
	for (let i = 0 ; i < tournaments.length; i++){
		if (tournaments[i]?.getMatch(game_id) !== undefined)
			return (true);
	}
	return (false);
}

export function matchOver(game){
	console.log("Mathc is over");

	let t = getTournament(tournaments, game.t_id);
	//set
	console.log(t);
	if (t === undefined){
		console.log("ERROR MATCH NOT FOUND")
		return ;
	}
	//tell clients
	t.updateRound(game);
	updateTournament();
}

function tournamentRoute (fastify, options) {
	
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
	
	
	/**
	* Websocket routes need to be registered before any other to handle events on socket
	* Connecting a client to the tournament
	*/
	fastify.get('/tournament/:id/ws', { websocket: true }, (socket, req) => {
		let username = req.query.username;
		let t_id = req.params.id;
		
		const   CONNECTING_STATE = 0;
		const   OPEN_STATE = 1;
		
		//Checking if user 
		if (username === null || username === undefined || t_id === null || t_id === undefined)
			return {success: false, error: "Need username and id"};
		
		if (!existsTournament(tournaments, t_id))
			return {success: false, error: "Tournament doesnt exists"};
		let t = getTournament(tournaments, t_id);
		if (t === undefined)
			return {success: false, error: "Unexpected error occured while fetching the tournament"};
		
		if (!t.contains(username))
			return {success: false, error: "Player not in this tournament"};
		
		// console.log("Trying new socket connection !");
		// Could be improved ...
		if (socket.readyState === OPEN_STATE){
			console.log("Player connected " + username.toString());
			t.connectPlayer(username, socket);
			updateTournament(t);
		}
		// socket.on("open", event => {
			//     console.log("Opening socket");
		//     console.log("Player connected " + username.toString());
		//     t.connectPlayer(username, socket);
		//     updateTournament(t);
		// });
		
		socket.on('message', (data) => {
			let message;
			try {
				message = JSON.parse(data.toString());
			} catch (err) {
				console.error('Invalid JSON:', data.toString());
				return; // maybe send a mesg to client instead
			}
			console.log("Recv message type :");
			console.log(message.type);
			if (message.type === "start"){
				// console.log("Starting tournament");
				if (!t.isReadyToStart()){
					socket.send(JSON.stringify({
						type: "error",
						message: "Tournament can't be started now"
					}));
				}else {
					t.startTournament();
					updateTournament(t);
				}
			} else if (message.type === "match"){
				if (message.state === "started"){
					
				}else if (message.state === "ended"){
					
				}
				updateTournament(t);
			} else if (message.type === "match_finished"){
				//Clients telling match is finished, we need both approval
				// Registering the game in db, we just save the game_id (primary key) and the tournament id;
			}
		});
		
		socket.on("close", (event) => {
			console.log("Player disconnected " + username.toString());
			t.disconnectPlayer(username, socket);
			t.removePlayer(username);
			updateTournament(t);
		});
		
		// t.connectPlayer(username, socket);
	});
	
	//Create a tournament
	fastify.post('/tournament/create', async (request, reply) => {
		let player = request.body.owner;
		let t_name = request.body.tournament_name;
		if (inTournament(tournaments, player))
			return {success: false, message: "Player can't create a tournament as he's already in one"};
		try {
			let new_t = addTournament(tournaments, max_t_id++, player, t_name);
			return {success: true, tournament : new_t};
		} catch (error) {
			console.log("error: ", error);
			return {success: false, message: error};
		}
	});
	
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
		// const tournament = tournaments[request.params.id];
		const tournament = getTournament(tournaments, request.params.id);
		if (tournament === undefined || tournament === null)
			return reply.status(404).send({ error: 'Tournament not found' });
		return {success: true, tournament: tournament};
	});
	
	// Declaring a match is over url to check. Not used for now, it is websocket that handles it
	fastify.get('/tournament/:id/match_over', async (request, reply) => {
		return {success: true};
	});
	const T_DSNT_EXISTS = 999;
	//Join a tournament
	fastify.get('/tournament/join/:id', async (request, reply) => {
		let t_id = request.params.id;
		let player_username = request.query.username;
		
		if (!existsTournament(tournaments, t_id))
			return {success: false, code: T_DSNT_EXISTS,  error: "Tournament doesnt exists"};
		
		if (inTournament(tournaments, player_username))
			return {success: false, message: "Player can't join a tournament as he's already in one"};
		
		let t = getTournament(tournaments, t_id);
		if (t.contains(player_username))
			return {success: false, error: "Player in the tournament"};
		
		if (t.isFull())
			return {success: false, error: "Tournament full"};
		
		t.addPlayer(player_username);
		//ServerSocket.sendMsg(); // HERE to update connected clients
		return {success: true, tournament : t};
	});
	
	//Leave a tournament
	fastify.get('/tournament/leave/:id', async (request, reply) => {
		let t_id = request.params.id;
		let user = request.query.username;
		if (!existsTournament(tournaments, t_id))
			return {success: false, error: "Tournament doesnt exists"};
		let t = getTournament(tournaments, t_id);
		if (!t.contains(user))
			return {success: false, error: "Player not in the tournament"};
		if (user === t.getOwner() && t.getSize() > 1)
			return {success: false, error: "Owner can't leave the room while other players are present"};
		
		t.disconnectPlayer(user);
		
		return {success: true};
	});
	
	//disband ? kick every player then leave
	fastify.get('/tournament/kick/:id', async(request, reply) => {
		let t_id = request.params.id;
		let owner = request.query.username;
		let user = request.query.username2;
		
		if (!existsTournament(tournaments, t_id))
			return {success: false, error: "Tournament doesnt exists"};
		
		let t = getTournament(tournaments, t_id);
		if (owner !== t.getOwner())
			return {success: false, error: "You are not the owner"};
		
		if (!t.contains(user))
			return {success: false, error: "Player not in the tournament"};
		
		t.disconnectPlayer(user);
		t.removePlayer(user);
		return {success: true};
	})
	
	//Starting the tournament. Not used for now, it is websocket that handles it
	fastify.get('/tournament/start/:id', async(request, reply) => {
		let t_id = request.params.id;
		let player = request.query.username;
		
		if (!existsTournament(tournaments, t_id))
			return {success: false, error: "Tournament doesnt exists"};
		
		let t = getTournament(tournaments, t_id);
		if (player !== t.getOwner())
			return {success: false, error: "Only owner can start tournament"};
		
		if (!t.isReadyToStart())
			return {success: false, error: "Not enough players to start tournament"};
		
		// startTournament(t);
		return ({success: true});
	})
	
	// For optimizition, the interval can be set only when at least a tournament exists
	setInterval(() => {
		tournaments.forEach(tournament => {
			// console.log(tournament);
			if (tournament === null){
				return ;
			}
			// Tournament garbage collector x)
			if (tournament.getSize() === 0){
				tournaments.splice(tournaments.indexOf(tournament));
			}
			if (tournament.isFinished())
				tournament.endTournament();
			else if (tournament.isRoundReadyToStart()){
				tournament.startRound();
			} else if (tournament.currentRoundIsFinished())
				tournament.initNextRound();
		});
	}, 30);
}

export default tournamentRoute;