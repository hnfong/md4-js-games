var msgBuffer = new Array();
var sendingMsgs = false;
var waitingMsgId = 0;
var recvBuffer = new Array();
var startMsgId = -1;
var processing = false;
var lastTime = new Date().getTime();

var my_next_seq = 0;
var send_queue = [];
var send_lock = false; /* javascript basically runs on a single thread, so it's
                          ok to just use a crappy variable to do locking,
                          provided the locking logic is correct */

var player_seq = new Object();
var player_seq_data = new Object();

function dispatchMessage(cmd, args)
{
	var a = [];

	if (typeof my_next_seq == 'undefined') {
		alert('Known bug of unknown cause encountered. Please refresh or report.');
		return;
	}

	a.push(my_next_seq++);
	a.push(game.myId);
	a.push(cmd);
	if (typeof args != 'undefined' && args != null) 
		for (var i = 0 ; i < args.length; i++) a.push(args[i]);
	var txt = a.join(" ");

	queueRemoteMessage(txt); /* dispatch to remote "players" */
	var need_refresh = messageHandler(txt); /* also dispatch to "localhost" */
	if (need_refresh) ui.refreshWindows(game.myId);
}

function queueRemoteMessage(txt, flush)
{
	if (typeof flush == 'undefined') flush = true;
	send_queue.push(txt);
	if (flush) sendRemoteMessages();
}

function sendRemoteMessages()
{
	if (send_lock) setTimeout("sendRemoteMessages()", 100);
	if (send_queue.length == 0) return;
	send_lock = true;
	var s = send_queue.join("\n") + "\n";
	while (true) {
		var a = send_queue.shift()
		if (typeof a == 'undefined') break;
	}
	var postdata = 'room='+game.room+'&msg='+ encodeURIComponent(s);
	__idplay__ajax_async('x.php', postdata, function(x) { send_lock = false; });
}

/* return value states whether refreshWindows is required */
var cmdHandlers = new Object(); /* "hash" */

cmdHandlers['transfer'] = function(p, args) {
	game.me.clearTrades();
	game.transferTurn(parseInt(args.shift()));
	return true;
};

cmdHandlers['roll'] = function(p,args) {
	var sum = 0;
	for (var i = 0;  i < game.numDice; i++)
		sum += parseInt(args[i]);
	ui.writeLog(p.name + ' rolled &lt;' + sum + "&gt;." );
	game.rollForResources(args);
	return true;
};

cmdHandlers['get_resources'] = function(p, args) {
	ui.writeLog(p.name + ' got ' + resourcesToString(args) + '.');
	p.addResources(args);
	return true;
};

cmdHandlers['start_game'] = function(p, args) {
	ui.writeLog('Game started!');
	game.start();
};

cmdHandlers['map_data'] = function(p, args) {
	board.loadMap(args);
	return false;
};

cmdHandlers['card_data'] = function(p, args) {
	devCards.load(args);
	return false;
};

cmdHandlers['sett'] = function(p, args) {
	ui.writeLog(p.name + ' built a settlement.');
	p._buildSett(parseInt(args[0]), parseInt(args[1]), parseInt(args[2]), parseInt(args[3]));
	return true;
};

cmdHandlers['road'] = function(p, args) {
	ui.writeLog(p.name + ' built a road.');
	p._buildRoad(parseInt(args[0]), parseInt(args[1]), parseInt(args[2]), parseInt(args[3]));
	return true;
};

cmdHandlers['city'] = function(p, args) {
	ui.writeLog(p.name + ' built a city.');
	p._buildCity(parseInt(args[0]), parseInt(args[1]), parseInt(args[2]));
	return true;
};

cmdHandlers['buy_card'] = function(p, args) {
	ui.writeLog(p.name + ' bought a development card.');
	p._buyCard();
	return true;
}

cmdHandlers['place_robber'] = function(p, args) {
	ui.writeLog(p.name + ' moved the robber.');
	board.placeRobber(parseInt(args[0]), parseInt(args[1]));
	return true;
};

cmdHandlers['discard'] = function(p, args) {
	ui.writeLog(p.name + ' discarded ' + resourcesToString(args) + '.');
	p.subtractResources(args);
	if (game.currentTurn == game.me.id) {
		game.hasDiscarded[p.id] = true;
		var allDiscarded = true;
		for (var i = 0; i < game.numPlayers; ++i)
			allDiscarded = allDiscarded && game.hasDiscarded[i];
		if (allDiscarded)
			changeState('place_robber');
	} else if (p.id == game.myId) /* FIXME: why is this here? */
		changeState('wait'); // TODO dialog onExit (note: this comment is by cmliu, i have no idea what it means -- Si)
	return true;
};

cmdHandlers['steal'] = function(p, args) {
	var myId = game.myId;

	var victim = game.players[parseInt(args[0])];
	var type   = parseInt(args[1]);

	if (args[0] == myId || p.id == myId)
		ui.writeLog(p.name + ' stole 1 ' + game.resourceNames[type] + ' from ' + victim.name + '.');
	else
		ui.writeLog(p.name + ' stole <i>something</i> from ' + victim.name + '.');
	p._steal(victim, type);
	return true;
};

cmdHandlers['use_card'] = function(p, args) {
	ui.writeLog(p.name + ' played ' + devCardsStatic[parseInt(args[0])].name + '.');
	p._useCard(parseInt(args[0]));
	return true;
};

cmdHandlers['monopoly'] = function(p, args) {
	ui.writeLog(p.name + ' has monopoly over ' + game.resourceNames[parseInt(args[0])]);
	p.monopoly(parseInt(args[0]));
	return true;
};

cmdHandlers['trade_self'] = function(p, args) {
	var give = new Array();
	var get = new Array();
	for (var i = 0; i < game.numResourceTypes; ++i)
		give.push(parseInt(args.shift()));
	for (var i = 0; i < game.numResourceTypes; ++i)
		get.push(parseInt(args.shift()));
	ui.writeLog(p.name + ' traded ' + resourcesToString(give) + ' for ' + resourcesToString(get) + '.');
	p.subtractResources(give);
	p.addResources(get);
	return true;
};

cmdHandlers['trade_propose'] = function(p, args) {
	var tid = parseInt(args.shift());
	var rec = parseInt(args.shift());
	if (rec != game.myId) return;
	var myGet = new Array();
	var myGive = new Array();
	for (var i = 0; i < game.numResourceTypes; ++i)
		myGet.push(parseInt(args.shift()));
	for (var i = 0; i < game.numResourceTypes; ++i)
		myGive.push(parseInt(args.shift()));
	var trade = new IncomingTrade(tid, game.myId, p.id);
	trade.setContract(myGive, myGet);
	trade.makeDialog();
	game.me.incomingTrades.push(trade);
	return false;
};

cmdHandlers['trade_cancel'] = function(p, args) {
	var tid = parseInt(args[0]);
	for (var i = 0; i < game.me.incomingTrades.length; ++i)
		if (game.me.incomingTrades[i].id == tid)
			game.me.incomingTrades[i].canceled();
	return false;
};

cmdHandlers['trade'] = function(p, args) {
	var to = game.players[parseInt(args.shift())];
	var give = new Array();
	var get = new Array();
	for (var i = 0; i < game.numResourceTypes; ++i)
		give.push(parseInt(args.shift()));
	for (var i = 0; i < game.numResourceTypes; ++i)
		get.push(parseInt(args.shift()));
	ui.writeLog(p.name + ' traded with ' + to.name + ': ' + resourcesToString(give) + ' vs ' + resourcesToString(get) + '.');
	p._trade(to, give, get);
	return true;
};

cmdHandlers['trade_accept'] = function(p, args) {
	var pid = parseInt(args.shift());
	var tid = parseInt(args.shift());
	var from = parseInt(args.shift());
	if (from != game.myId) return;
	for (var i = 0; i < game.me.outgoingTrades.length; ++i)
		if (game.me.outgoingTrades[i].id == tid)
			game.me.outgoingTrades[i].accepted(pid);
	return false;
};

cmdHandlers['trade_reject'] = function(p, args) {
	var pid = parseInt(args.shift());
	var tid = parseInt(args.shift());
	var from = parseInt(args.shift());
	if (from != game.myId) return;
	for (var i = 0; i < game.me.outgoingTrades.length; ++i)
		if (game.me.outgoingTrades[i].id == tid)
			game.me.outgoingTrades[i].rejected(pid);
	return false;
};

cmdHandlers['counter_propose'] = function(p, args) {
	var tid = parseInt(args.shift());
	var rec = parseInt(args.shift());
	if (rec != game.myId) return;
	var myGet = new Array();
	var myGive = new Array();
	for (var i = 0; i < game.numResourceTypes; ++i)
		myGet.push(parseInt(args.shift()));
	for (var i = 0; i < game.numResourceTypes; ++i)
		myGive.push(parseInt(args.shift()));
	for (var i = 0; i < game.me.outgoingTrades.length; ++i)
		if (game.me.outgoingTrades[i].id == tid)
			game.me.outgoingTrades[i].counter(p.id, myGive, myGet);
	return false;
};

cmdHandlers['largest_army'] = function(p, args) {
	for (var j = 0 ; j < game.players.length; j++)
		game.players[j].hasLargestArmy = false;
	p.hasLargestArmy = true;
	ui.writeLog(p.name + ' has the largest army');
	return true;
};

cmdHandlers['longest_road'] = function(p, args) {
	for (var j = 0 ; j < game.players.length; j++)
		game.players[j].hasLongestRoad = false;
	p.hasLongestRoad = true;
	ui.writeLog(p.name + ' has the longest road');
	return false;
	// return true;
};

cmdHandlers['win'] = function(p, args) {
	ui.writeLog(p.name + ' won with ' + args[0] + ' points.');
	changeState('idle');
	return true;
};

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
		var r = messageHandler(recvBuffer[0]);
		need_refresh = need_refresh || r;
		recvBuffer.shift();
		startMsgId++;
	}
	if (need_refresh) ui.refreshWindows(game.myId);
	processing = false;
}

/* returns whether need to refreshWindows */
function messageHandler(txt)
{
	var a = txt.split(' ');
	/* this is a hack for the join command */
	if (a[2] == 'join') {
		game.join(a[3]);
		if (game.myId == 0) g('startgamebutton').disabled = false;
		ui.writeLog('Player <i>' + a[3] + '</i> arrived.');
		return false;
	}

	var seq = parseInt(a.shift());
	var pid = a.shift();
	var cmd = a.shift();
	var p = game.players[pid];

	if (typeof player_seq[pid] == 'undefined') {
		player_seq[pid] = -1;
		player_seq_data[pid] = new Object();
	}

	if (seq <= player_seq[pid]) return false;

	/* save it to be played later */
	player_seq_data[pid][seq] = {cmd:cmd,p:p,a:a};

	var ret = false;
	var k;
	for (k = player_seq[pid]+1; typeof player_seq_data[pid][k] != 'undefined'; k++) {
		player_seq[pid] = k;
		var s = player_seq_data[pid][k];
		if (typeof cmdHandlers[s.cmd] != 'undefined') {
			ret = cmdHandlers[s.cmd](s.p, s.a) || ret;
		} else {
			debug('unhandled command: ' + s.cmd);
		}
		delete player_seq_data[pid][k];
	}

	return ret;
}
