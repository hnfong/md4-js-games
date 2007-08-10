function State(name) {
	this.name = name;

	this.onEnter = function() {};
	this.onLeave = function() {};

	this.cellHandler = function() {};
	this.vertexHandler = function() {};
	this.edgeHandler = function() {};
	this.diceHandler = function() {};
	this.buttonHandler = function() {};
	this.customHandler = function() {};
}


var states = new Array();
var state = new State();


function changeState(stateName) {
	state.onLeave();
	g('status').innerHTML = 'Status: ' + stateName;
	ui_refreshWindows(myId);
	state = states[stateName];
	state.onEnter();
}


{ // free: my turn, do whatever i want
	var st = new State('free');
	st.onEnter = function() { setImageMapMode(nullMode); };
	st.buttonHandler = function(b) {
		if (b == 'button_buy_road') {
			if (players[myId].buildingCounts[roadConst] >= maxRoads) {
				alert('No more roads!');
				return;
			}
			if (hasEnoughResources(players[myId].resources, roadCost)) {
				alert('Not enough resources!');
				return;
			}
			changeState('build_road');

		} else if (b == 'button_buy_sett') {
			if (players[myId].buildingCounts[settConst] >= maxSetts) {
				alert('No more settlements!');
				return;
			}
			if (hasEnoughResources(players[myId].resources, settCost)) {
				alert('Not enough resources!');
				return;
			}
			changeState('build_sett');

		} else if (b == 'button_buy_city') {
			if (players[myId].buildingCounts[cityConst] >= maxCities) {
				alert('No more cities!');
				return;
			}
			if (hasEnoughResources(players[myId].resources, cityCost)) {
				alert('Not enough resources!');
				return;
			}
			changeState('build_city');

		} else if (b == 'button_buy_devcard') {
			if (remainingDevCards() <= 0) {
				alert('No more development cards!');
				return;
			}
			if (hasEnoughResources(players[myId].resources, cardCost)) {
				alert('Not enough resources!');
				return;
			}
			priv_buyCard();
			changeState('free');

		} else if (b == 'button_end_turn') {
			priv_transferTurn();

		}
	};
	states['free'] = st;
}
{ // wait: not my turn
	var st = new State('wait');
	st.onEnter = function() { setImageMapMode(nullMode); };
	states['wait'] = st;
}
{ // roll: roll for resources
	var st = new State('roll');
	st.onEnter = function() { setImageMapMode(nullMode); };
	st.diceHandler = function() {
		if (priv_rollForResources())
			changeState('free');
		else
			changeState('place_robber');
	};
	states['roll'] = st;
}
{ // build_road: buy and build a road
	var st = new State('build_road');
	st.onEnter = function() {
		g('button_buy_road').value = 'Cancel';
		setImageMapMode(edgeMode);
	};
	st.onLeave = function() {
		g('button_buy_road').value = 'Buy';
	}
	st.edgeHandler = function(i, j, e) {
		if (priv_buildRoad(i, j, e, true)) {
			changeState('free');
		}
	};
	st.buttonHandler = function(b) {
		if (b == 'button_buy_road') {
			changeState('free');
		}
	};
	states['build_road'] = st;
}
{ // build_sett: buy and build a settlement
	var st = new State('build_sett');
	st.onEnter = function() {
		g('button_buy_sett').value = 'Cancel';
		setImageMapMode(vertexMode);
	};
	st.onLeave = function() {
		g('button_buy_sett').value = 'Buy';
	}
	st.vertexHandler = function(i, j, v) {
		if (priv_buildSett(i, j, v, true, false)) {
			changeState('free');
		}
	};
	st.buttonHandler = function(b) {
		if (b == 'button_buy_sett') {
			changeState('free');
		}
	};
	states['build_sett'] = st;
}
{ // build_city: buy and build a city
	var st = new State('build_city');
	st.onEnter = function() {
		g('button_buy_city').value = 'Cancel';
		setImageMapMode(vertexMode);
	};
	st.onLeave = function() {
		g('button_buy_city').value = 'Buy';
	}
	st.vertexHandler = function(i, j, v) {
		if (priv_buildCity(i, j, v, false)) {
			changeState('free');
		}
	};
	st.buttonHandler = function(b) {
		if (b == 'button_buy_city') {
			document.getElementById('button_buy_city').value = 'Buy';
			changeState('free');
		}
	};
	states['build_city'] = st;
}
{ // build_initial_sett: build initial (i.e. the first two) settlement
	var st = new State('build_initial_sett');
	st.onEnter = function() { setImageMapMode(vertexMode); };
	st.vertexHandler = function(i, j, v) {
		if (priv_buildSett(i, j, v, true, true)) { // free + ignore reachability
			changeState('build_initial_road');
			initialSett = { i: i, j: j, v: v }; 
		}
	};
	states['build_initial_sett'] = st;
}
{ // build_initial_road: build initial (i.e. the first two) road
	var st = new State('build_initial_road');
	st.onEnter = function() { setImageMapMode(edgeMode); };
	st.edgeHandler = function(i, j, e) {
		if (priv_buildRoad(i, j, e, true, true)) { // free + ignore reachability
			if (players[myId].buildingCounts[settConst] == 1) {
				var next = (myId + 1) % numPlayers;
				if (next == firstPlayer) // I am the last player, so build again
					changeState('build_initial_sett');
				else
					priv_transferTurn(next);
			} else { // 2 settlements
				var next = (myId + numPlayers - 1) % numPlayers;
				if (myId == firstPlayer)
					changeState('roll');
				else
					priv_transferTurn(next);
			}
		}
	};
	states['build_initial_road'] = st;
}
{ // place_robber
	var st = new State('place_robber');
	st.onEnter = function() { setImageMapMode(cellMode); };
	st.cellHandler = function(i, j) {
		if (priv_placeRobber(i, j)) {
			var stealable = false;
			for (var v = 0; v < 6; ++v) {
				var own = vertexOwner(i, j, v);
				if (own >= 0 && own != myId)
					if (players[own].numResources() > 0)
						stealable = true;
			}
			if (stealable)
				changeState('steal');
			else
				changeState('free');			
		}
	};
	states['place_robber'] = st;
}
{ // steal
	var st = new State('steal');
	st.onEnter = function() {
		setImageMapMode(nullMode);
		ui_showStealWindow(myId);
	};
	st.onLeave = function() {
		ui_hideStealWindow();
	};
	st.customHandler = function(victim) {
		if (priv_steal(victim))
			changeState('free');
	};
	states['steal'] = st;
}