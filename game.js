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
}

Game.prototype.start = function(playerNames, mapData)
{
	this.numPlayers = playerNames.length;
	this.players = new Array();
	for (var i = 0; i < playerNames.length; ++i)
		if (i == myId) {
			this.players.push(new Me(i, playerNames[i]));
		} else {
			this.players.push(new Player(i, playerNames[i]));
		}

	this.me = this.players[myId];

	if (mapData == null)
		board.randomizeCells();
	else
		board.loadMap(mapData);

	board.drawBoard();
	board.drawMarkers();

	ui.initCellMap();
	ui.initVertexMap();
	ui.initEdgeMap();

	ui.refreshWindows(myId);

	vertexBuildingMap = new Array();
	edgeBuildingMap = new Array();
	vertexReachableMap = new Array();

	initRolls = create1DArray(this.numPlayers);
	tiedPlayers = new Array();
	for (var i = 0; i < this.numPlayers; ++i)
		tiedPlayers.push(i);

	changeState('wait');
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
	currentTurn = next;
	if (currentTurn != game.me.id)
		changeState('wait');
	else {
		if (game.me.buildingCounts[game.ROAD] < 2)
			changeState('build_initial_sett');
		else
			changeState('roll');
	}
};

