/* a collection of UI-related code */

//IMAGE MAP CONSTANTS
var NULLMODE = 0;
var CELLMODE = 1;
var vertexMODE = 2;
var EDGEMODE = 3;

var ui = new Object();

/* creates the image map of cells */
ui.initCellMap = function() {
	for (var i = 0; i < board.WIDTH; ++i)
	for (var j = 0; j < board.HEIGHT; ++j)
	if (isValidCell(i, j)) {
		var area = document.createElement('area');
		var x = cellXY(i,j).x;
		var y = cellXY(i,j).y;
		area.setAttribute('shape', 'polygon');
		area.setAttribute('coords', (x+18) + ',' + (y) + ',' +
		                            (x+52) + ',' + (y) + ',' +
		                            (x+71) + ',' + (y+31) + ',' +
		                            (x+52) + ',' + (y+63) + ',' +
		                            (x+18) + ',' + (y+63) + ',' +
		                            (x) + ',' + (y+31));
		area.setAttribute('onmousedown', 'state.cellHandler('+i+','+j+');return false;');
		document.getElementById('cellmap').appendChild(area);
	}
};

/* creates the image map of vertices */
ui.initVertexMap = function() {
	for (var i = -1; i <= board.WIDTH; ++i)
	for (var j = -1; j <= board.HEIGHT; ++j)
	for (var v = 0; v < 2; ++v)
	if (isValidVertex(i, j, v)) {
		var area = document.createElement('area');
		var x = vertexXY(i,j,v).x;
		var y = vertexXY(i,j,v).y;
		area.setAttribute('shape', 'rect');
		area.setAttribute('coords', (x-12) + ',' + (y-12) + ',' +
		                            (x+12) + ',' + (y+12));
		area.setAttribute('onmousedown', 'state.vertexHandler('+i+','+j+','+v+');return false;');
		document.getElementById('vertexmap').appendChild(area);
	}
};

/* creates the image map of edges */
ui.initEdgeMap = function() {
	for (var i = -1; i <= board.WIDTH; ++i)
	for (var j = -1; j <= board.HEIGHT; ++j)
	for (var e = 0; e < 3; ++e)
	if (isValidEdge(i, j, e)) {
		var area = document.createElement('area');
		var x1 = vertexXY(i,j,e).x;
		var y1 = vertexXY(i,j,e).y;
		var x2 = vertexXY(i,j,(e+1)%6).x;
		var y2 = vertexXY(i,j,(e+1)%6).y;
		area.setAttribute('shape', 'polygon');
		switch (e) {
			case 0:
				area.setAttribute('coords', (x1+5) + ',' + (y1-7) + ',' +
				                            (x2-5) + ',' + (y2-7) + ',' +
				                            (x2-5) + ',' + (y2+7) + ',' +
				                            (x1+5) + ',' + (y1+7));
				break;
			case 1:
				area.setAttribute('coords', (x1+9) + ',' + (y1+2) + ',' +
				                            (x2+1) + ',' + (y2-9) + ',' +
				                            (x2-9) + ',' + (y2-2) + ',' +
				                            (x1-1) + ',' + (y1+9));
				break;
			case 2:
				area.setAttribute('coords', (x1+1) + ',' + (y1+9) + ',' +
				                            (x2+9) + ',' + (y2-2) + ',' +
				                            (x2-1) + ',' + (y2-9) + ',' +
				                            (x1-9) + ',' + (y1+2));
				break;
		}
		area.setAttribute('onmousedown', 'state.edgeHandler('+i+','+j+','+e+');return false;');
		document.getElementById('edgemap').appendChild(area);
	}
};

ui.drawDice = function(a) {
	var txt = '';
	for (var i = 0; i < a.length; ++i) {
		txt += '<img src="img/dice'+a[i]+'.png">';
	}
	g('dice').innerHTML = txt;
};

ui.rollingDice = function() {
	g('dice').innerHTML = '<img src="img/dice_ani1.gif"><img src="img/dice_ani2.gif">';
};


ui.hideStealWindow = function() {
	g('steal_window').style.visibility = 'hidden';	
};

ui.writeLog = function (txt) {
	var logger = g('log_window');
	var div = document.createElement("DIV");
	div.innerHTML = txt;
	logger.insertBefore(div, logger.firstChild);
};

ui.showPlayerWindow = function() {
	var txt = '';
	for (var i = 0; i < game.numPlayers; ++i) {
		txt += '<div style="background-color:' + playerColors[i] + ';">';
		if (game.currentTurn == i)
			txt += '<b><i><u>' + game.players[i].name + '</u></i></b><br/>';
		else
			txt += '<b>' + game.players[i].name + '</b><br/>';
		txt += 'Points: ' + game.players[i].points() + '<br/>';
		txt += 'Soldiers: ' + game.players[i].soldiers + '<br/>';
		txt += 'Longest Road Length: ' + game.players[i].calcLongestRoad() + '<br/>';
		txt += 'Resource cards: ' + game.players[i].numResources() + '<br/>';
		txt += 'Development cards: ' + game.players[i].devCards.length + '</div>';
		txt += '<hr/>';
	}
	g('player_window').innerHTML = txt;
};

ui.showResourceWindow = function(pid) {
	var p = game.players[pid];
	var txt = '';
	for (var i = 0; i < game.numResourceTypes; ++i)
		txt += '<img src="img/'+game.resourceNames[i]+'_small.gif"> ' + game.resourceNames[i]  + ": " + p.resources[i] + "<br/>";
	g('res_window').innerHTML = txt;
};

ui.showPurchaseWindow = function (pid) {
	var p = game.players[pid];
	var txt = '';

	function dumpCost(a) {
		var s = '';
		for (var i = 0; i < game.numResourceTypes; ++i)
			if (a[i] > 0)
				s += '<img src="img/'+game.resourceNames[i]+'_small.gif">' + ' x' + a[i] + '&nbsp;';
		return s;
	}

	txt += 'Development Card <input type="button" id="button_buy_devcard" value="Buy" style="border:1px solid black;" onclick="state.buttonHandler(\'button_buy_devcard\');return false;"/> (' + devCards.length + ' left)<br/>' + dumpCost(game.cardCost) + '<br/><hr/>';
	txt += 'City <input type="button" id="button_buy_city" value="Buy" style="border:1px solid black;" onclick="state.buttonHandler(\'button_buy_city\');return false;"/> (' + (game.maxCities-game.players[pid].buildingCounts[game.CITY]) + ' left)<br/>' + dumpCost(game.cityCost) + '<br/><hr/>';
	txt += 'Settlement <input type="button" id="button_buy_sett" value="Buy" style="border:1px solid black;" onclick="state.buttonHandler(\'button_buy_sett\');return false;"/> (' + (game.maxSetts-game.players[pid].buildingCounts[game.SETT]) + ' left)<br/>' + dumpCost(game.settCost) + '<br/><hr/>';
	txt += 'Road <input type="button" id="button_buy_road" value="Buy" style="border:1px solid black;" onclick="state.buttonHandler(\'button_buy_road\');return false;"/> (' + (game.maxRoads-game.players[pid].buildingCounts[game.ROAD]) + ' left)<br/>' + dumpCost(game.roadCost) + '<br/><hr/>';

	g('purchase_window').innerHTML = txt;
};


ui.refreshWindows = function (pid) {
	ui.showPlayerWindow();
	if (pid >= 0) {
		ui.showResourceWindow(pid);
		ui.showPurchaseWindow(pid);
		ui.showDevCardWindow(pid);
	}
};

ui.showStealWindow = function (pid) {
	var victims = new Array();
	for (var v = 0; v < 6; ++v) {
		var own = vertexOwner(board.robberPos.i, board.robberPos.j, v);
		if (own >= 0 && own != pid) {
			if (game.players[own].numResources() > 0) {
				var existed = false;
				for (var i = 0; i < victims.length; ++i)
					if (victims[i] == own)
						existed = true;
				if (!existed)
					victims.push(own);
			}
		}
	}

	var txt = 'Steal from:<br/>';
	for (var i = 0; i < victims.length; ++i)
		txt += '<a href="#" onmousedown="state.customHandler(' + victims[i] + ');return false;">' + game.players[victims[i]].name + '</a><br/>';
	g('steal_window').innerHTML = txt;
	g('steal_window').style.visibility = 'visible';
};


ui.showDevCardWindow = function (pid) {
	var txt = 'Development Cards:<br/>';
	var player = game.players[pid];
	for (var i = 0; i < player.devCards.length; ++i) {
		var card = player.devCards[i];
		txt += '<a href="#" onclick="if(state.name!=\'free\')return false; game.me.useCard(' + card.id + ');ui.refreshWindows(' + pid + ');return false;">' + card.name + '</a><br/>';
	} 
	g('devcard_window').innerHTML = txt;
};

ui.setImageMapMode = function(mapMode) {
	var map;
	switch (mapMode) {
		case NULLMODE: map = ''; break;
		case CELLMODE: map = '#cellmap'; break;
		case vertexMODE: map = '#vertexmap'; break;
		case EDGEMODE: map = '#edgemap'; break;
		default: map = ''; break;
	}
	g('board_interface').useMap = map;
};

