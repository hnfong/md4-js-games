function Player(id, name) { Player.construct(this,id,name); }

/* this is a "static" function to workaround js's problem of not calling super() */
Player.construct = function(obj,id,name) {
	if (id == null) return; // this is for the Me.prototype as shown below. ugly, but i dunno any workarounds
	obj.id = id;
	obj.name = name;
	if (!name)
		obj.name = 'Player #' + obj.id;
	obj.vpcardPoints = 0;
	obj.buildingCounts = create1DArray(3); // roads, settlements, cities
	obj.devCards = new Array();
	obj.resources = create1DArray(game.numResourceTypes);
	obj.soldiers = 0;
	obj.longestRoadLength = 0;

	obj.hasLongestRoad = false;
	obj.hasLargestArmy = false;

	obj.tradeRates = new Array();
	for (var i = 0; i < game.numResourceTypes; ++i)
		obj.tradeRates.push(4);
};

function Me(id, name) { Player.construct(this, id, name); } // subclass of Player.
Me.prototype = new Player();
Me.prototype.outgoingTrades = new Array();
Me.prototype.incomingTrades = new Array();

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

	Player.prototype.numResources = function() {
		var total = 0;
		for (var i = 0; i < game.numResourceTypes; ++i)
			total += this.resources[i];
		return total;			
	};

	Player.prototype.calcLongestRoad = function() {
		// find this player's edges
		var roads = new Array();
		for (var i = -1; i <= board.WIDTH; ++i)
			for (var j = -1; j <= board.HEIGHT; ++j)
				for (var e = 0; e < 3; ++e) {
					var s = edgeToString(i, j, e);
					if (edgeBuildingMap[s] != null && edgeBuildingMap[s].owner == this.id) {
						var v0 = vertexToString(i, j, e);
						var v1 = vertexToString(i, j, (e+1)%6);
						roads.push( { a: v0, b: v1 } );
					}
				}
		// build adjacency list
		var adjList = new Array(roads.length * 2);
		for (var i = 0; i < adjList.length; ++i) {
			adjList[i] = new Array();
			var x = (i < roads.length) ? roads[i].b : roads[i-roads.length].a;
			for (var j = 0; j < adjList.length; ++j) {
				if (i == j || Math.abs(i - j) == roads.length) continue;
				var y = (j < roads.length) ? roads[j].a : roads[j-roads.length].b;
				if (x != y) continue;
				if (vertexBuildingMap[x] != null && vertexBuildingMap[x].owner != this.id) continue;
				adjList[i].push(j);
			}
		}

		var visited = create1DArray(adjList.length);

		var dfs = function(v, len, adjList, visited) {
			var maximum = len;
			visited[v] = 1;
			for (var j = 0; j < adjList[v].length; ++j) {
				var k = adjList[v][j];
				if (!visited[k] && !visited[(k + adjList.length/2) % adjList.length]) {
					var retval = dfs(k, len+1, adjList, visited);
					maximum = Math.max(retval, maximum);
				}
			}
			visited[v] = 0;
			return maximum;
		};

		this.longestRoadLength = 0;
		for (var i = 0; i < adjList.length; ++i) {
			var retval = dfs(i, 1, adjList, visited);
			this.longestRoadLength = Math.max(retval, this.longestRoadLength);
		}

		return this.longestRoadLength;

	};

	Player.prototype.vpcard = function() {
		this.vpcardPoints++;
		ui.showPlayerWindow();
	};

	Player.prototype.points = function()
	{
		var points = 0;
		points += this.vpcardPoints;
		points += this.buildingCounts[game.SETT] * game.settBonus;
		points += this.buildingCounts[game.CITY] * game.cityBonus;
		points += (this.hasLongestRoad?game.longestRoadBonus:0);
		points += (this.hasLargestArmy?game.largestArmyBonus:0);

		return points;
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

	this.calcLongestRoad();
	game.updateLongestRoad();
};
Player.prototype._buildRoad = Player.prototype.buildRoad; /* FIXME: this is a temporary hack to get to the parent class from outside */

Me.prototype.buildRoad = function(i, j, e, isFree, ignoreReachability)
{
	if (!this.buildRoadCheck(i, j, e, ignoreReachability)) return false;
	dispatchMessage('road', [i,j,e,isFree?1:0]);
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

	// update trade rates
	{
		var s = vertexToString(i, j, v);
		if (board.vertexPortMap[s]) {
			var type = board.vertexPortMap[s].type;
			var rate = board.vertexPortMap[s].rate;
			if (type == board.WILDCARD_PORT) {
				for (var k = 0; k < game.numResourceTypes; ++k)
					this.tradeRates[k] = Math.min(this.tradeRates[k],  rate);
			} else {
				this.tradeRates[type] = Math.min(this.tradeRates[type], rate);
			}
		}
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

Player.prototype._buildSett = Player.prototype.buildSett; /* FIXME: this is a temporary hack to get to the parent class from outside */

Me.prototype.buildSett = function(i, j, v, isFree, ignoreReachability)
{
	if (!this.buildSettCheck(i, j, v, ignoreReachability)) return false;
	dispatchMessage('sett', [ i, j, v, isFree?1:0 ]);
	return true;
};

Me.prototype.rollForResources = function() {
	var a = util.roll();
	dispatchMessage('roll', a);
	var sum  = 0;
	for (var i = 0 ; i < a.length; i++) {
		sum += a[i];
	}
	return sum;
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

Player.prototype._buildCity = Player.prototype.buildCity; /* FIXME: this is a temporary hack to get to the parent class from outside */

Me.prototype.buildCity = function(i, j, v) {
	if (!this.buildCityCheck(i, j, v)) return false;
	dispatchMessage('city', [i,j,v]);
	return true;
};

Player.prototype.buyCard = function() {
	this.devCards.push(devCards.draw());
	this.subtractResources(game.cardCost);
};

Player.prototype._buyCard = Player.prototype.buyCard;

Me.prototype.buyCard = function () {
	dispatchMessage('buy_card');
};

Me.prototype.placeRobber = function(i, j) {
	if (board.robberPos.i < 0 || board.cellResources[i][j] >= 0 && (i != board.robberPos.i || j != board.robberPos.j)) {
		dispatchMessage('place_robber', [i, j]);
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

Player.prototype._steal = Player.prototype.steal; /* FIXME: this is a temporary hack to get to the parent class from outside */

Me.prototype.steal = function(victim) {
	var a = new Array();
	for (var i = 0; i < game.numResourceTypes; ++i)
		for (var j = 0; j < victim.resources[i]; ++j)
			a.push(i);
	var k = randInt(a.length);
	var type = a[k];
	dispatchMessage('steal', [ victim.id, type ]);
	return true;
};

Player.prototype.monopoly = function(type) {
	for (var i = 0 ; i < game.numPlayers; i++) {
		var victim = game.players[i];
		if (victim == this) continue;
		var count = victim.resources[type];
		if (count <= 0) continue;
		victim.resources[type] -= count;
		this.resources[type] += count;
		ui.writeLog(this.name + ' took ' + count + ' ' + game.resourceNames[type] + ' from ' + victim.name);
	}
};

Player.prototype.trade = function(p, give, get) {
	p.addResources(give);
	p.subtractResources(get);
	this.addResources(get);
	this.subtractResources(give);
};

Player.prototype._trade = Player.prototype.trade; /* FIXME: this is a temporary hack to get to the parent class from outside */

Me.prototype.trade = function(tid, pid) {
	var give = null;
	var get = null;
	var tr = null;
	for (var i = 0; i < this.outgoingTrades.length; ++i) {
		var t = this.outgoingTrades[i];
		if (t.id == tid) {
			tr = t;
			give = t.give;
			get = t.get;
		}
	}
	if (!hasEnoughResources(game.me.resources, give)) {
		alert('You do not have enough resources!');
		return false;
	}
	if (!hasEnoughResources(game.players[pid].resources, get)) {
		alert('The player does not have enough resources!');
		return false;
	}
	var a = [pid];
	util.concat_array(a, give);
	util.concat_array(a, get);
	dispatchMessage('trade', a);
	tr.finish();
	return true;
};

Me.prototype.transferTurn = function(next) {
	if (next == null)
		next = (this.id + 1) % game.numPlayers;

	if (this.points() >= game.goalPoints)
		dispatchMessage('win', [this.points()]);
	else
		dispatchMessage('transfer', [ next ]);
};

Player.prototype.useCard = function(cid) {
	var card = null;

	for (var i = 0 ; i < this.devCards.length; i++)
	{
		if (this.devCards[i].id == cid) {
			card = this.devCards[i];
			this.devCards.splice(i,1);
		}
	}

	if (card == null) throw "useCard == null?! (cid = " + cid + ")";

	card.use(this);
};

Player.prototype._useCard = Player.prototype.useCard; /* FIXME: this is a temporary hack to get to the parent class from outside */

Me.prototype.useCard = function(cid)
{
	if (game.usedCard == 1)
	{
		if (devCardsStatic[cid].type != 'vp')
		{
			alert("You may only use one development card per turn.");
			return false;
		}
	}
	if (devCardsStatic[cid].just_bought) {
		if (devCardsStatic[cid].type != 'vp') {
			alert("You cannot use the card you just bought in this turn.");
			return false;
		}
	}
	dispatchMessage('use_card', [cid]);
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
	dispatchMessage('get_resources', gain);
};

Me.prototype.proposeTrade = function(give, get, recipients) {
	var maxid = this.id * 1000000;
	for (var i = 0; i < this.outgoingTrades.length; ++i)
		maxid = Math.max(maxid, this.outgoingTrades[i].id);
	var tid = maxid + randInt(100);
	var trade = new OutgoingTrade(tid, this.id);
	trade.setRecipients(recipients);
	trade.setContract(give, get);
	trade.makeDialog();
	game.me.outgoingTrades.push(trade);
	trade.propose();
};

Me.prototype.clearTrades = function() {
	for (var i = 0; i < this.outgoingTrades.length; ++i)
		this.outgoingTrades[i].dialog.dispose();
	this.outgoingTrades = new Array();
	for (var i = 0; i < this.incomingTrades.length; ++i)
		this.incomingTrades[i].dialog.dispose();
	this.incomingTrades = new Array();
};

Me.prototype.acceptTrade = function(tid) {
	for (var i = 0; i < this.incomingTrades.length; ++i)
		if (this.incomingTrades[i].id == tid) {
			if (!hasEnoughResources(this.resources, this.incomingTrades[i].give)) {
				alert('You do not have enough resources!');
				return false;
			}
			this.incomingTrades[i].accept();
		}
};

Me.prototype.rejectTrade = function(tid) {
	for (var i = 0; i < this.incomingTrades.length; ++i)
		if (this.incomingTrades[i].id == tid)
			this.incomingTrades[i].reject();
};

Me.prototype.counterTrade = function(tid) {
	for (var i = 0; i < this.incomingTrades.length; ++i)
		if (this.incomingTrades[i].id == tid)
			this.incomingTrades[i].counter();
};

Me.prototype.cancelTrade = function(tid) {
	for (var i = 0; i < this.outgoingTrades.length; ++i)
		if (this.outgoingTrades[i].id == tid)
			this.outgoingTrades[i].cancel();
};

Me.prototype.show_counter_detail = function(tid, pid) {
	var give = null;
	var get = null;
	var tr = null;
	for (var i = 0; i < this.outgoingTrades.length; ++i) {
		var t = this.outgoingTrades[i];
		if (t.id == tid) {
			tr = t;
			for (var j = 0; j < t.recipients.length; ++j)
				if (t.recipients[j] == pid) {
					give = t.counter_give[j];
					get  = t.counter_get[j];
				}
		}
	}
	var counter = new IncomingCounter(tid, game.me.id, pid, tr);
	counter.setContract(give, get);
	tr.counter_dialog = counter;
	counter.makeDialog();
	tr.hide();
};

Me.prototype.acceptCounter = function(tid, pid) {
	var give = null;
	var get = null;
	var tr = null;
	for (var i = 0; i < this.outgoingTrades.length; ++i) {
		var t = this.outgoingTrades[i];
		if (t.id == tid) {
			tr = t;
			for (var j = 0; j < t.recipients.length; ++j)
				if (t.recipients[j] == pid) {
					give = t.counter_give[j];
					get  = t.counter_get[j];
				}
		}
	}
	if (!hasEnoughResources(game.me.resources, give)) {
		alert('You do not have enough resources!');
		return false;
	}
	if (!hasEnoughResources(game.players[pid].resources, get)) {
		alert('The player does not have enough resources!');
		return false;
	}
	var a = [pid];
	util.concat_array(a, give);
	util.concat_array(a, get);
	dispatchMessage('trade', a);
	tr.finish();
	tr.counter_dialog.hide();
	return true;
};

Me.prototype.cancelCounter = function(tid, pid) {
	for (var i = 0; i < this.outgoingTrades.length; ++i) {
		var t = this.outgoingTrades[i];
		if (t.id == tid) {
			tr = t;
		}
	}
	tr.counter_dialog.hide();
	tr.show();
};
