// global game settings object
var __game_defaults =
{
	maxPlayers : 4,
	numResourceTypes : 5,
	resourceNames : new Array('sheep', 'ore', 'wheat', 'wood', 'clay'),

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
function Game(settings) {
	if (settings == undefined || settings == null) settings = {};

	for (var k in __game_defaults)
	{
		this[k] = (settings[k] != undefined ? settings[k] : __game_defaults[k]);
	}
}
