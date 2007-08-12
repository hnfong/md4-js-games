/*
   Some inheritance techniques may have been borrowed from:
   http://truecode.blogspot.com/2006/08/object-oriented-super-class-method.html
*/

function Player(id, name) { this.construct(id,name); }
Player.prototype.construct = function(id,name) {
	if (id == undefined) return; // this is for the Me.prototype as shown below. ugly, but i dunno any workarounds
	this.id = id;
	this.name = name;
	if (!name)
		this.name = 'Player #' + this.id;
	this.extraPoints = 0;
	this.buildingCounts = create1DArray(3); // roads, settlements, cities
	this.devCards = new Array();
	this.resources = create1DArray(game.numResourceTypes);
	this.soldiers = 0;
};

function Me(id, name) { Player.prototype.construct.call(this, id, name); } // subclass of Player.
Me.prototype = new Player();

{
	Player.prototype.buildRoadCheck = function(i, j, e, ignoreReachability) {
		var s = edgeToString(i, j, e);
		if (edgeBuildingMap[s]) return false;
		var v1 = e;
		var v2 = (e+1) % 6;
		var v1Owner = vertexOwner(i, j, v1);
		var v2Owner = vertexOwner(i, j, v2);
		var v1Extensible, v2Extensible;
		if (ignoreReachability) {
			v1Extensible = isSameVertex(initialSett.i, initialSett.j, initialSett.v, i, j, v1);
			v2Extensible = isSameVertex(initialSett.i, initialSett.j, initialSett.v, i, j, v2);
		} else {
			v1Extensible = this.isVertexReachable(i, j, v1) && (v1Owner < 0 || v1Owner == this.id);
			v2Extensible = this.isVertexReachable(i, j, v2) && (v2Owner < 0 || v2Owner == this.id);
		}
		if (!v1Extensible && !v2Extensible) return false;
		return true;
	};

	Player.prototype.buildSettCheck = function(i, j, v, ignoreReachability) {
		// occupied...
		if (vertexOwner(i, j, v) >= 0) return false;
		// any of the two adjacent vertices occupied...
		if (vertexOwner(i, j, (v+1)%6) >= 0) return false;
		if (vertexOwner(i, j, (v+5)%6) >= 0) return false;
		// the remaining adjacent vertex occupied...
		var cv = commonVertex[v][0];
		if (vertexOwner(i+cv.i, j+cv.j, (cv.v+5)%6) >= 0) return false;
		// not reachable!
		if (!ignoreReachability && !this.isVertexReachable(i, j, v)) return false;
		return true;
	};

	Player.prototype.buildCityCheck = function(i, j, v) {
		var s = vertexToString(i, j, v);
		if (!vertexBuildingMap[s]) return false;
		if (vertexBuildingMap[s].owner != this.id) return false;
		if (vertexBuildingMap[s].type != game.SETT) return false;
		return true;
	};

	Player.prototype.addResources = function(array) {
		for (var i = 0; i < array.length; ++i)
			this.resources[i] += parseInt(array[i]);
	};

	Player.prototype.subtractResources = function(array) {
		for (var i = 0; i < array.length; ++i)
			this.resources[i] -= parseInt(array[i]);
	};

	Player.prototype.getOneResource = function(res) {
		this.resources[res]++;
	};

	Player.prototype.loseOneResource = function(res) {
		this.resources[res]--;
	};

	Player.prototype.isVertexReachable = function(i, j, v) {
		var s = vertexToString(i, j, v);
		if (!vertexReachableMap[s]) return false;
		var a = vertexReachableMap[s];
		for (var i = 0; i < a.length; ++i)
			if (a[i] == this.id)
				return true;
		return false;
	};

	Player.prototype.addVertexReachable = function(i, j, v) {
		var s = vertexToString(i, j, v);
		if (!vertexReachableMap[s]) {
			vertexReachableMap[s] = new Array();
			vertexReachableMap[s].push(this.id);
		}
		var a = vertexReachableMap[s];
		for (var i = 0; i < a.length; ++i)
			if (a[i] == this.id)
				return;
		a.push(this.id);
	};

	Player.prototype.isVertexOwned = function(i, j, v) {
		var s = vertexToString(i, j, v);
		if (!vertexBuildingMap[s]) return false;
		if (vertexBuildingMap[s].owner != this.id) return false;
		return vertexBuildingMap[s].type;
	};

	Player.prototype.isEdgeOwned = function(i, j, e) {
		var s = edgeToString(i, j, e);
		if (!edgeBuildingMap[s]) return false;
		if (edgeBuildingMap[s].owner != this.id) return false;
		return edgeBuildingMap[s].type;
	};

	Player.prototype.points = function() {
		return this.buildingCounts[game.SETT] + this.buildingCounts[game.CITY] * 2 + this.extraPoints;
	};

	Player.prototype.numResources = function() {
		var total = 0;
		for (var i = 0; i < game.numResourceTypes; ++i)
			total += this.resources[i];
		return total;			
	};
}


Player.prototype.buildRoad = function(i, j, e, isFree) {
	if (!isFree)
		this.subtractResources(game.roadCost);

	// internal data changes
	{
		var s = edgeToString(i, j, e);
		var v1 = e;
		var v2 = (e+1) % 6;
		this.addVertexReachable(i, j, v1);
		this.addVertexReachable(i, j, v2);
		edgeBuildingMap[s] = { owner: this.id, type: game.ROAD };
		this.buildingCounts[game.ROAD]++;
	};

	// external ui updates
	var o = canonicalEdge(i, j, e);
	var x = vertexXY(i, j, e).x;
	var y = vertexXY(i, j, e).y;
	var road = document.createElement('img');
	road.setAttribute('src', 'img/road' + o.e + '_' + this.id + '.gif');
	road.style.position = 'absolute';
	switch (o.e) {
		case 0:
			road.style.left = (x + game.XDELTA) + 'px';
			road.style.top = (y-2 + game.YDELTA) + 'px';
			break;
		case 1:
			road.style.left = (x + game.XDELTA) + 'px';
			road.style.top = (y + game.YDELTA) + 'px';
			break;
		case 2:
			road.style.left = (x-19 + game.XDELTA) + 'px';
			road.style.top = (y+ game.YDELTA) + 'px';
			break;
	}
	g('roads').appendChild(road);
};

Me.prototype.buildRoad = function(i, j, e, isFree, ignoreReachability) // FIXME: additional param "ignoreReachability" compared with Player.buildRoad ?
{
	if (!this.buildRoadCheck(i, j, e, ignoreReachability)) return false;
	Player.prototype.buildRoad.call(this, i, j, e, isFree);
	if (isFree)
		sendRemoteMessage('build_road ' + myId + ' ' + i + ' ' + j + ' ' + e);
	else
		sendRemoteMessage('buy_road ' + myId + ' ' + i + ' ' + j + ' ' + e);
	return true;
};


Player.prototype.buildSett = function(i, j, v, isFree)
{
	if (!isFree)
		this.subtractResources(game.settCost);

	// internal data structure changes
	{
		var s = vertexToString(i, j, v);
		this.addVertexReachable(i, j, v);
		vertexBuildingMap[s] = { owner: this.id, type: game.SETT };
		this.buildingCounts[game.SETT]++;
	}

	// ui changes
	var x = vertexXY(i, j, v).x;
	var y = vertexXY(i, j, v).y;
	var sett = document.createElement('img');
	sett.setAttribute('src', 'img/sett_' + this.id + '.gif');
	sett.style.position = 'absolute';
	sett.style.left = (x-10+game.XDELTA) + 'px';
	sett.style.top = (y-10+game.YDELTA) + 'px';
	sett.id = 'sett_id_' + vertexToString(i, j, v);
	g('buildings').appendChild(sett);
};


Me.prototype.buildSett = function(i, j, v, isFree, ignoreReachability)
{
	if (!this.buildSettCheck(i, j, v, ignoreReachability)) return false;
	if (isFree)
		sendRemoteMessage('build_sett ' + myId + ' ' + i + ' ' + j + ' ' + v);
	else
		sendRemoteMessage('buy_sett ' + myId + ' ' + i + ' ' + j + ' ' + v);
	
	Player.prototype.buildSett.call(this, i, j, v, isFree);
	return true;
};

Me.prototype.rollForResources = function() {
	var a = roll();
	var txt = '';
	for (var i = 0; i < game.numDice; ++i)
		txt += ' ' + a[i];
	sendRemoteMessage('roll ' + this.id + txt);
	return game.rollForResources(a);
};

Player.prototype.buildCity = function(i, j, v) {
	this.subtractResources(game.cityCost);

	// internal
	{
		var s = vertexToString(i, j, v);
		vertexBuildingMap[s].type = game.CITY;
		this.buildingCounts[game.SETT]--;
		this.buildingCounts[game.CITY]++;
	}

	// ui
	var img = g('sett_id_' + vertexToString(i, j, v));
	img.src = 'img/city_' + this.id+ '.gif';
};

Me.prototype.buildCity = function(i, j, v) {
	if (!this.buildCityCheck(i, j, v)) return false;
	sendRemoteMessage('buy_city ' + this.id + ' ' + i + ' ' + j + ' ' + v);
	Player.prototype.buildCity.call(this, i, j, v, myId);
	return true;
};

Player.prototype.buyCard = function() {
	this.devCards.push(devCards.draw());
};

Me.prototype.buyCard = function () {
	sendRemoteMessage('buy_devcard ' + this.id);
	Player.prototype.buyCard.call(this);
};

Me.prototype.placeRobber = function(i, j) {
	if (board.robberPos.i < 0 || board.cellResources[i][j] >= 0 && (i != board.robberPos.i || j != board.robberPos.j)) {
		sendRemoteMessage('place_robber ' + myId + ' ' + i + ' ' + j);
		board.placeRobber(i, j);
		return true;
	}
	alert('Cannot put the robber here!');
	return false;
};

Player.prototype.steal = function(victim, type) {
	victim.resources[type]--;
	this.resources[type]++;
	return type;
};

Me.prototype.steal = function(victim) {
	var a = new Array();
	for (var i = 0; i < game.numResourceTypes; ++i)
		for (var j = 0; j < victim.resources[i]; ++j)
			a.push(i);
	var k = randInt(a.length);
	var type = a[k];
	sendRemoteMessage('steal ' + this.id + ' ' + victim.id + ' ' + type);
	var t = Player.prototype.steal.call(this, victim, type);
	return true;
};

Me.prototype.transferTurn = function(next) {
	if (next == null)
		next = (myId + 1) % game.numPlayers;

	if (this.points() >= game.goalPoints)
		sendRemoteMessage('win ' + this.id + ' ' + this.points());
	else
		sendRemoteMessage('transfer ' + this.id + ' ' + next);

	game.transferTurn(next);
};

Player.prototype.useCard = function(cid) {
	var card = null;
	debug('cid = ' + cid);

	for (var i = 0 ; i < this.devCards.length; i++)
	{
		debug('i have card where id = ' + this.devCards[i].id);
		if (this.devCards[i].id == cid) {
			card = this.devCards[i];
			this.devCards.splice(i,1);
		}
	}

	if (card == null) throw "useCard == null?! (cid = " + cid + ")";

	card.use(this);
};

Me.prototype.useCard = function(cid)
{
	sendRemoteMessage('use_card ' + this.id + ' ' + cid);
	Player.prototype.useCard.call(this, cid);
};

Player.prototype.adjustExtraPoints = function(inc) {
	this.extraPoints += inc;
};

Me.prototype.adjustExtraPoints = function(inc) {
	sendRemoteMessage('adjust_extra ' +  this.id + ' ' + inc); // FIXME: really needed? isn't it simply a matter of checking state changes?
	Player.prototype.adjustExtraPoints.call(this, inc);
};

Me.prototype.getInitialResources = function() {
	var gain = create1DArray(game.numResourceTypes);
	var i = initialSett.i, j = initialSett.j;
	if (isValidCell(i, j) && board.cellResources[i][j] >= 0)
		gain[board.cellResources[i][j]]++;
	var i2 = i + commonVertex[initialSett.v][0].i;
	var j2 = j + commonVertex[initialSett.v][0].j;
	if (isValidCell(i2, j2) && board.cellResources[i2][j2] >= 0)
		gain[board.cellResources[i2][j2]]++;
	var i3 = i + commonVertex[initialSett.v][1].i;
	var j3 = j + commonVertex[initialSett.v][1].j;
	if (isValidCell(i3, j3) && board.cellResources[i3][j3] >= 0)
		gain[board.cellResources[i3][j3]]++;
	sendRemoteMessage('get_resources ' + this.id + ' ' + dumpArray(gain));
	this.addResources(gain);
};

