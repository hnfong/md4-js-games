function Player(id, name) {
	this.id = id;
	this.name = name;
	if (!name)
		this.name = 'Player #' + this.id;
	this.extraPoints = 0;
	this.buildingCounts = create1DArray(3); // roads, settlements, cities
	this.devCards = new Array();
	this.resources = create1DArray(game.numResourceTypes);

	this.buildRoadCheck = function(i, j, e, ignoreReachability) {
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
	}

	this.buildRoad = function(i, j, e) {
		var s = edgeToString(i, j, e);
		var v1 = e;
		var v2 = (e+1) % 6;
		this.addVertexReachable(i, j, v1);
		this.addVertexReachable(i, j, v2);
		edgeBuildingMap[s] = { owner: this.id, type: game.ROAD };
		this.buildingCounts[game.ROAD]++;
	};

	this.buildSettCheck = function(i, j, v, ignoreReachability) {
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

	this.buildSett = function(i, j, v) {
		var s = vertexToString(i, j, v);
		this.addVertexReachable(i, j, v);
		vertexBuildingMap[s] = { owner: this.id, type: game.SETT };
		this.buildingCounts[game.SETT]++;
	}

	this.buildCityCheck = function(i, j, v) {
		var s = vertexToString(i, j, v);
		if (!vertexBuildingMap[s]) return false;
		if (vertexBuildingMap[s].owner != this.id) return false;
		if (vertexBuildingMap[s].type != game.SETT) return false;
		return true;
	};

	this.buildCity = function(i, j, v) {
		var s = vertexToString(i, j, v);
		vertexBuildingMap[s].type = game.CITY;
		this.buildingCounts[game.SETT]--;
		this.buildingCounts[game.CITY]++;
		return true;
	};

	this.addResources = function(array, silent) {
		for (var i = 0; i < array.length; ++i)
			this.resources[i] += array[i];
	};

	this.subtractResources = function(array) {
		for (var i = 0; i < array.length; ++i)
			this.resources[i] -= array[i];
	};

	this.getOneResource = function(res) {
		this.resources[res]++;
	};

	this.loseOneResource = function(res) {
		this.resources[res]--;
	};

	this.isVertexReachable = function(i, j, v) {
		var s = vertexToString(i, j, v);
		if (!vertexReachableMap[s]) return false;
		var a = vertexReachableMap[s];
		for (var i = 0; i < a.length; ++i)
			if (a[i] == this.id)
				return true;
		return false;
	};

	this.addVertexReachable = function(i, j, v) {
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

	this.isVertexOwned = function(i, j, v) {
		var s = vertexToString(i, j, v);
		if (!vertexBuildingMap[s]) return false;
		if (vertexBuildingMap[s].owner != this.id) return false;
		return vertexBuildingMap[s].type;
	};

	this.isEdgeOwned = function(i, j, e) {
		var s = edgeToString(i, j, e);
		if (!edgeBuildingMap[s]) return false;
		if (edgeBuildingMap[s].owner != this.id) return false;
		return edgeBuildingMap[s].type;
	};

	this.points = function() {
		return this.buildingCounts[game.SETT] + this.buildingCounts[game.CITY] * 2 + this.extraPoints;
	}

	this.numResources = function() {
		var total = 0;
		for (var i = 0; i < game.numResourceTypes; ++i)
			total += this.resources[i];
		return total;			
	}
}
