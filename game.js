// global game settings object
var __game_defaults =
{
	maxPlayers : 4,
	numResourceTypes : 5,
	resourceNames : new Array('sheep', 'ore', 'wheat', 'wood', 'clay'),

	XDELTA    : 0,
	YDELTA    :-120,

	DESERT    : -1,
	SEA       : -2,

	ROAD      : 0,
	SETT      : 1,
	CITY      : 2,

	goalPoints: 10,
	numDice   : 2,
	numDiceFaces: 6,
	maxRoads  : 15,
	maxSetts  : 5,
	maxCities : 4,
	resourceCardLimit: 7,
	robberOutcome: 7,

	numSoldierCards: 14,
	numVPCards: 5,
	numRoadCards: 2,
	numPlentyCards: 2,

	vpCardNames: new Array('Library','Market','Cathedral','Town Hall','University'), // FIXME: what are the names?? (some are prob. incorrect since I merely recalled from vague memory)

	roadCost : new Array(0, 0, 0, 1, 1),
	settCost : new Array(1, 0, 1, 1, 1),
	cityCost : new Array(0, 3, 2, 0, 0),
	cardCost : new Array(1, 1, 1, 0, 0),

	settBonus : 1,
	cityBonus : 2,
	longestRoadBonus : 2,
	largestArmyBonus : 2,
};


// Note: need to edit images as well
var playerColors = new Array('blue', 'red', 'green', 'orange');


// settings is a dictionary of settings that overrides the defaults. if none, defaults are used.
function Game(settings)
{
	if (settings == undefined || settings == null) settings = {};

	for (var k in __game_defaults)
	{
		this[k] = (settings[k] != undefined ? settings[k] : __game_defaults[k]);
	}

	this.playerNames = new Array();
}

Game.prototype.start = function()
{
	this.numPlayers = this.playerNames.length;
	this.players = new Array();
	for (var i = 0; i < this.playerNames.length; ++i)
		if (i == this.myId) {
			this.players.push(new Me(i, this.playerNames[i]));
		} else {
			this.players.push(new Player(i, this.playerNames[i]));
		}

	this.me = this.players[this.myId];

	board.drawBoard();
	board.drawMarkers();

	ui.initCellMap();
	ui.initVertexMap();
	ui.initEdgeMap();

	ui.refreshWindows(this.myId);

	vertexBuildingMap = new Array();
	edgeBuildingMap = new Array();
	vertexReachableMap = new Array();

	initRolls = create1DArray(this.numPlayers);
	tiedPlayers = new Array();
	for (var i = 0; i < this.numPlayers; ++i)
		tiedPlayers.push(i);

	firstPlayer = 0;
	game.transferTurn(0);
};

Game.prototype.rollForResources = function (a) {
	ui.drawDice(a);
	var outcome = 0;
	for (var i = 0; i < game.numDice; ++i)
		outcome += parseInt(a[i]);

	if (outcome == game.robberOutcome)
		return false;

	// initialize "gain"
	var gain = new Array(game.numPlayers);
	for (var i = 0; i < game.numPlayers; ++i) {
		gain[i] = new Array(game.numResourceTypes);
		for (var j = 0; j < game.numResourceTypes; ++j)
			gain[i][j] = 0;
	}

	// calculate how much each player gains
	var cells = board.outcomeCellMap[outcome];
	if (!cells) return true;
	for (var i = 0; i < cells.length; ++i) {
		var o = cells[i];
		if (o.i == board.robberPos.i && o.j == board.robberPos.j) continue;
		var resType = board.cellResources[o.i][o.j];
		if (resType < 0) continue;
		for (var v = 0; v < 6; ++v) {
			var b = vertexBuilding(o.i, o.j, v);
			if (!b) continue;
			switch (b.type) {
				case game.SETT: gain[b.owner][resType]++; break;
				case game.CITY: gain[b.owner][resType] += 2; break;
				default: break;
			}
		}
	}

	// add them to player's resource tables
	for (var i = 0; i < game.numPlayers; ++i)
		game.players[i].addResources(gain[i]);

	for (var i = 0; i < game.numPlayers; ++i)
		ui.writeLog(game.players[i].name + ' got ' + resourcesToString(gain[i]) + '.');

	return true;
};

Game.prototype.transferTurn = function (next) {
	this.currentTurn = next;
	if (this.currentTurn != game.me.id)
		changeState('wait');
	else {
		if (game.me.buildingCounts[game.ROAD] < 2)
			changeState('build_initial_sett');
		else
			changeState('roll');
	}
};

Game.prototype.join = function(name)
{
	this.playerNames.push(name);
	if (name == this.myName) {
		this.myId = this.playerNames.length - 1;
	}
};

// set up the game/board, and starts the game. used by "player 0" only
Game.prototype.setup = function() {
	board.randomizeCells();
	devCards.shuffle();
	game.start();
	{ // send map data
		var s = '';
		s += 'map_data ' + game.myId + ' ' + board.WIDTH + ' ' + board.HEIGHT;
		s += ' ' + dumpArray(board.data);
		s += ' ' + dumpArray(board.cellResources);
		s += ' ' + dumpArray(board.cellMarkers);
		s += ' ' + board.robberPos.i + ' ' + board.robberPos.j;
		sendRemoteMessage(s);

		s = 'card_data';
		for (var i = 0 ; i < devCards.length; i++){
			s += ' ' + devCards[i].id;
		}
		sendRemoteMessage(s);
	}
	sendRemoteMessage('start_game 0');
};
