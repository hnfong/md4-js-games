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

	Player.prototype.buildSett = function(i, j, v) {
		var s = vertexToString(i, j, v);
		this.addVertexReachable(i, j, v);
		vertexBuildingMap[s] = { owner: this.id, type: game.SETT };
		this.buildingCounts[game.SETT]++;
	};

	Player.prototype.buildCityCheck = function(i, j, v) {
		var s = vertexToString(i, j, v);
		if (!vertexBuildingMap[s]) return false;
		if (vertexBuildingMap[s].owner != this.id) return false;
		if (vertexBuildingMap[s].type != game.SETT) return false;
		return true;
	};

	Player.prototype.buildCity = function(i, j, v) {
		var s = vertexToString(i, j, v);
		vertexBuildingMap[s].type = game.CITY;
		this.buildingCounts[game.SETT]--;
		this.buildingCounts[game.CITY]++;
		return true;
	};

	Player.prototype.addResources = function(array, silent) {
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
}

Me.prototype.buildRoad = function(i, j, e, isFree, ignoreReachability) // FIXME: additional param "ignoreReachability" compared with Player.buildRoad ?
{
	if (!this.buildRoadCheck(i, j, e, ignoreReachability)) return false;
	Player.prototype.buildRoad.call(this, i, j, e, isFree);
	if (isFree)
		sendRemoteMessage('build_road ' + myId + ' ' + i + ' ' + j + ' ' + e);
	else
		sendRemoteMessage('buy_road ' + myId + ' ' + i + ' ' + j + ' ' + e);
	return true;
}

