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
	numMonopolyCards: 2,

	vpCardNames: new Array('Library','Market','Cathedral','Town Hall','University'), // FIXME: what are the names?? (some are prob. incorrect since I merely recalled from vague memory)

	roadCost : new Array(0, 0, 0, 1, 1),
	settCost : new Array(1, 0, 1, 1, 1),
	cityCost : new Array(0, 3, 2, 0, 0),
	cardCost : new Array(1, 1, 1, 0, 0),

	settBonus : 1,
	cityBonus : 2,
	longestRoadBonus : 2,
	largestArmyBonus : 2,

	// Note: to change the player colors, you need to edit images as well
	playerColors : new Array('#4040FF', '#FF4000', '#008000', '#FFA500'),
	playerColors2: new Array('#202080', '#883000', '#004000', '#806000') /* darker colors of playerColors2, currently used for border */
};

// settings is a dictionary of settings that overrides the defaults. if none, defaults are used.
function Game(room, settings)
{
	if (typeof settings == 'undefined' || settings == null) settings = {};

	for (var k in __game_defaults)
	{
		this[k] = ( (typeof settings[k] != 'undefined') ? settings[k] : __game_defaults[k]);
	}

	this.room = room;
	this.players = new Array();
}

Game.prototype.start = function()
{
	this.started = true;
	this.numPlayers = this.players.length;
	if (this.myId == -1) this.me = new Me(this.myId, name);

	board.drawBoard();
	board.drawMarkers();
	board.drawPorts();

	vertexBuildingMap = new Array();
	edgeBuildingMap = new Array();
	vertexReachableMap = new Array();

	ui.initCellMap();
	ui.initVertexMap();
	ui.initEdgeMap();

	tradeProposeDialog_init();
	counterProposeDialog_init();

	ui.refreshWindows(this.myId);

	this.hasDiscarded = create1DArray(this.numPlayers);

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

	if (outcome == game.robberOutcome) {
		if (game.me.numResources() > game.resourceCardLimit)
			changeState('discard');
		return false;
	}

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
	this.usedCard = 0;
	for (var i = 0; i < game.players[this.currentTurn].devCards.length; ++i) {
		game.players[this.currentTurn].devCards[i].just_bought = false;
	}
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
	if (this.started)
	{
		/* FIXME: HACK - this is hackish code which is supposed to work but shouldn't be here! */
		if (name == this.myName && typeof this.me != 'undefined' ) {
			my_next_seq = player_seq[this.myId] + 1;
		}
		return;
	}

	var already_exist = false;
	for (var i = 0 ; i < this.players.length; i ++) {
		if (this.players[i].name == name) already_exist = true;
	}
	if (already_exist) return;

	var l = this.players.length;
	if (name == this.myName) {
		this.me = new Me(l, name);
		this.players.push(this.me);
		this.myId = l;
	} else {
		this.players.push(new Player(l, name));
	}
};

// set up the game/board, and starts the game. used by "player 0" only
Game.prototype.setup = function() {
	g('startgamebutton').disabled = true;
	board.randomizeCells();
	devCards.shuffle();
	{ // send map data
		var mapdata = [];
		mapdata.push(board.WIDTH);
		mapdata.push(board.HEIGHT);
		util.concat_array(mapdata, board.data);
		util.concat_array(mapdata, board.cellResources);
		util.concat_array(mapdata, board.cellMarkers);

		for (var i = 0; i < board.WIDTH; ++i)
			for (var j = 0; j < board.HEIGHT; ++j)
				if (board.data[i][j] == board.PORT) {
					mapdata.push(board.cellPorts[i][j].type);
					mapdata.push(board.cellPorts[i][j].dir);
					mapdata.push(board.cellPorts[i][j].rate);
				} else {
					mapdata.push(0);
					mapdata.push(0);
					mapdata.push(0);
				}

		mapdata.push(board.robberPos.i);
		mapdata.push(board.robberPos.j);
		dispatchMessage('map_data', mapdata);

		var carddata = [];
		for (var i = 0 ; i < devCards.length; i++) carddata.push(devCards[i].id);
		dispatchMessage('card_data', carddata);
	}
	dispatchMessage('start_game');
};

// update (if required) the player with longest road status
Game.prototype.updateLongestRoad = function()
{
	for (var i = 0 ; i < this.players.length; i++)
	{
		var p = this.players[i];
		if (p.longestRoadLength >= 5)
		{
			// check whether the player has a road length strictly greater than other players
			var pislongest = true; 
			for (var j = 0 ; j < this.players.length; j++)
			{
				var p2 = this.players[j];
				if (p == p2) continue;
				if (p2.longestRoadLength >= p.longestRoadLength)
				{
					pislongest = false;
					break;
				}
			}

			/* declare to have longest road */
			if (pislongest && ! p.hasLongestRoad && p.id == game.myId) {
				dispatchMessage('longest_road');
				return;
			}
		}
	}
};

// update (if required) the player with largest army status
Game.prototype.updateLargestArmy = function()
{
	for (var i = 0 ; i < this.players.length; i++)
	{
		var p = this.players[i];
		if (p.soldiers >= 3)
		{
			// check whether the player has a road length strictly greater than other players
			var pislargest = true; 
			for (var j = 0 ; j < this.players.length; j++)
			{
				var p2 = this.players[j];
				if (p == p2) continue;
				if (p2.soldiers >= p.soldiers)
				{
					pislargest = false;
					break;
				}
			}

			/* declare to have largest army */
			if (pislargest && ! p.hasLargestArmy && p.id == game.myId) {
				dispatchMessage('largest_army');
				return;
			}
		}
	}
};

