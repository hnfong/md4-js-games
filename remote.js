var msgBuffer = new Array();
var sendingMsgs = false;
var waitingMsgId = 0;
var recvBuffer = new Array();
var startMsgId = -1;
var processing = false;
var lastTime = new Date().getTime();

function sendRemoteMessage(txt) {
	if (txt != null) msgBuffer.push(txt);
	if (msgBuffer.length == 0 || sendingMsgs) return;
	var now = new Date().getTime();
	if (now - lastTime < 300) {
		setTimeout("sendRemoteMessage()", 300);
		return;
	}
	lastTime = new Date().getTime();
	sendingMsgs = true;
	var s = '';
	while (msgBuffer.length > 0) {
		s += msgBuffer.shift() + '\n';
	}
	sendingMsgs = false; // FIXME: shouldn't be here

	var postdata = 'room='+game.room+'&msg='+ encodeURIComponent( s );

	__idplay__ajax_async('x.php', postdata, function(x){});
}

function clearRemoteLog() {
	var postdata = 'room='+game.room+'&cmd=clear';
	__idplay__ajax_async('x.php', postdata, function(x){});
}


function receiveRemoteMessages() {
	setTimeout('receiveRemoteMessages()', 2000);
	var f = function(http) {
		var s = http.responseText;
		var a = s.split('\n');
		if (waitingMsgId <= a.length - 2) {
			if (recvBuffer.length == 0)
				startMsgId = waitingMsgId;
			for (var i = waitingMsgId; i < a.length-1; ++i)
				recvBuffer.push(a[i]);
			waitingMsgId = a.length - 1;
			processMessages();
		}
	};
	__idplay__ajax_async('rooms/' + game.room, '', f);
}



function processMessages() {
	if (processing || recvBuffer.length == 0) return;
	processing = true;
	var need_refresh = false;
	while (recvBuffer.length > 0) {
		var r = remoteMessageHandler(recvBuffer[0]);
		need_refresh = need_refresh || r;
		recvBuffer.shift();
		startMsgId++;
	}
	if (need_refresh) ui.refreshWindows(game.myId);
	processing = false;
}

/* returns whether need to refreshWindows */
function remoteMessageHandler(txt)
{
	var a = txt.split(' ');
	var cmd = a[0];
	var pid = a[1];
	var myId = game.myId;

	if (game.players != undefined) {
		var p = game.players[pid];
	}

	switch(cmd)
	{
		case 'roll':
			if (pid == myId) return;
			a.shift();
			a.shift();
			game.rollForResources(a);
			break;
		case 'transfer':
			game.me.clearTrades();
			if (pid == myId) return;
			game.transferTurn(a[2]);
			break;
		case 'buy_road':
			ui.writeLog(p.name + ' built a road.');
			if (pid == myId) return;
			p.buildRoad(parseInt(a[2]), parseInt(a[3]), parseInt(a[4]), false);
			break;
		case 'buy_sett':
			ui.writeLog(p.name + ' built a settlement.');
			if (pid == myId) return;
			p.buildSett(parseInt(a[2]), parseInt(a[3]), parseInt(a[4]), false);
			break;

		case 'buy_city':
			ui.writeLog(p.name + ' built a city.');
			if (pid == myId) return;
			p.buildCity(parseInt(a[2]), parseInt(a[3]), parseInt(a[4]));
			break;

		case 'buy_devcard':
			ui.writeLog(p.name + ' bought a development card.');
			if (pid == myId) return;
			p.buyCard();
			break;

		case 'build_road':
			ui.writeLog(p.name + ' built a road.');
			if (pid == myId) return;
			p.buildRoad(parseInt(a[2]), parseInt(a[3]), parseInt(a[4]), true);
			break;

		case 'build_sett':
			ui.writeLog(p.name + ' built a settlement.');
			if (pid == myId) return;
			p.buildSett(parseInt(a[2]), parseInt(a[3]), parseInt(a[4]), true);
			break;

		case 'get_resources':
			a.shift();
			a.shift();
			ui.writeLog(p.name + ' got ' + resourcesToString(a) + '.');
			if (pid == myId) return;
			p.addResources(a);
			break;

		case 'discard':
			a.shift();
			a.shift();
			ui.writeLog(p.name + ' discarded ' + resourcesToString(a) + '.');
			if (game.currentTurn == game.me.id) {
				game.hasDiscarded[pid] = true;
				var allDiscarded = true;
				for (var i = 0; i < game.numPlayers; ++i)
					allDiscarded = allDiscarded && game.hasDiscarded[i];
				if (allDiscarded)
					changeState('place_robber');
			} else if (pid == myId)
				changeState('wait'); // TODO dialog onExit
			if (pid == myId) return;
			p.subtractResources(a);
			break;

		case 'place_robber':
			ui.writeLog(p.name + ' moved the robber.');
			if (pid == myId) return;
			board.placeRobber(parseInt(a[2]), parseInt(a[3]));
			break;

		case 'steal':
			if (myId == a[2] || pid == myId)
				ui.writeLog(p.name + ' stole 1 ' + game.resourceNames[parseInt(a[3])] + ' from ' + game.players[parseInt(a[2])].name + '.');
			else
				ui.writeLog(p.name + ' stole <i>something</i> from ' + game.players[parseInt(a[2])].name + '.');
			if (pid == myId) return;
			p.steal(game.players[parseInt(a[2])], parseInt(a[3]));
			break;

		case 'monopoly':
			ui.writeLog(p.name + ' took ' + parseInt(a[4]) + ' ' + game.resourceNames[parseInt(a[3])] + ' from ' + game.players[parseInt(a[2])].name + '.');
			if (pid == myId) return;
			p.monopoly(game.players[parseInt(a[2])], parseInt(a[3]), parseInt(a[4]));
			break;

		case 'use_card':
			ui.writeLog(p.name + ' played ' + devCardsStatic[parseInt(a[2])].name + '.');
			if (pid == myId) return;
			p.useCard(parseInt(a[2]));
			break;

		case 'trade_self':
			var give = new Array();
			var get = new Array();
			a.shift();
			a.shift();
			for (var i = 0; i < game.numResourceTypes; ++i)
				give.push(parseInt(a.shift()));
			for (var i = 0; i < game.numResourceTypes; ++i)
				get.push(parseInt(a.shift()));
			ui.writeLog(p.name + ' traded ' + resourcesToString(give) + ' for ' + resourcesToString(get) + '.');
			if (pid == myId) return;
			p.subtractResources(give);
			p.addResources(get);
			break;

		case 'trade_propose':
			a.shift();
			a.shift();
			var tid = parseInt(a.shift());
			var rec = parseInt(a.shift());
			if (rec != myId) return;
			var myGet = new Array();
			var myGive = new Array();
			for (var i = 0; i < game.numResourceTypes; ++i)
				myGet.push(parseInt(a.shift()));
			for (var i = 0; i < game.numResourceTypes; ++i)
				myGive.push(parseInt(a.shift()));
			var trade = new IncomingTrade(tid, myId, pid);
			trade.setContract(myGive, myGet);
			trade.makeDialog();
			game.me.incomingTrades.push(trade);
			break;

		case 'trade_accept':
			var from = parseInt(a[3]);
			if (from != myId) return;
			var tid = parseInt(a[2]);
			for (var i = 0; i < game.me.outgoingTrades.length; ++i)
				if (game.me.outgoingTrades[i].id == tid)
					game.me.outgoingTrades[i].accepted(pid);
			break;

		case 'trade_reject':
			var from = parseInt(a[3]);
			if (from != myId) return;
			var tid = parseInt(a[2]);
			for (var i = 0; i < game.me.outgoingTrades.length; ++i)
				if (game.me.outgoingTrades[i].id == tid)
					game.me.outgoingTrades[i].rejected(pid);
			break;

		case 'trade_cancel':
			var tid = parseInt(a[2]);
			for (var i = 0; i < game.me.incomingTrades.length; ++i)
				if (game.me.incomingTrades[i].id == tid)
					game.me.incomingTrades[i].canceled();
			break;

		case 'trade':
			var to = parseInt(a[2]);
			var give = new Array();
			var get = new Array();
			a.shift();
			a.shift();
			a.shift();
			for (var i = 0; i < game.numResourceTypes; ++i)
				give.push(parseInt(a.shift()));
			for (var i = 0; i < game.numResourceTypes; ++i)
				get.push(parseInt(a.shift()));
			ui.writeLog(p.name + ' traded with ' + game.players[to].name + ': ' + resourcesToString(give) + ' vs ' + resourcesToString(get) + '.');
			if (pid == myId) return;
			p.trade(game.players[to], give, get);
			break;

		case 'init_roll':
			break;

		case 'largest_army':
			ui.writeLog(p.name + ' has the largest army');
			break;

		case 'longest_road':
			for (var j = 0 ; j < game.players.length; j++)
				game.players[j].hasLongestRoad = false;
			p.hasLongestRoad = true;
			ui.writeLog(p.name + ' has the longest road');
			break;

		case 'win':
			ui.writeLog(p.name + ' won with ' + a[2] + ' points.');
			changeState('idle');
			break;

		case 'start_game':
			ui.writeLog('Game started!');
			if (myId == pid) return;
			game.start();
			break;

		// pre-game.start stuff. return instead of break
		case 'join':
			game.join(a[1]);
			if (game.myId == 0) g('startgamebutton').disabled = false;
			ui.writeLog('Player <i>' + a[1] + '</i> arrived.');
			return false;

		case 'map_data':
			if (myId == pid) return;
			a.shift();
			a.shift();
			board.loadMap(a);
			return false;

		case 'card_data':
			if (myId == pid) return;
			a.shift();
			devCards.load(a);
			return false;
	}

	return true;

}
