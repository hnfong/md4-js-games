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
	sendingMsgs = true;
	var s = '';
	while (msgBuffer.length > 0) {
		s += msgBuffer.shift() + '\n';
	}
	sendingMsgs = false; // FIXME: shouldn't be here

	var postdata = 'msg='+ encodeURIComponent( s );
	__idplay__ajax_async('x.php', postdata, function(x){});
	lastTime = new Date().getTime();
}

function clearRemoteLog() {
	var postdata = 'cmd=clear';
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
	__idplay__ajax_async('xxx.html', '', f);
}



function processMessages() {
	if (processing || recvBuffer.length == 0) return;
	processing = true;
	while (recvBuffer.length > 0) {
		remoteMessageHandler(recvBuffer[0]);
		recvBuffer.shift();
		startMsgId++;
	}
	processing = false;
}

function remoteMessageHandler(txt)
{
	var a = txt.split(' ');
	var cmd = a[0];
	var pid = a[1];
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
			p.buyCard(parseInt(a[2]));
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
			if (pid == myId) return;
			a.shift();
			a.shift();
			p.addResources(a);
			break;

		case 'discard':
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
		case 'use_card':
			if (pid == myId) return;
			ui.writeLog(p.name + ' played ' + p.devCards[parseInt(a[2])].name + '.');
			p.useCard(parseInt(a[2]));
			break;

		case 'adjust_extra':
			if (pid == myId) return;
			p.adjustExtraPoints(parseInt(a[2]));
			break;

		case 'propose_trade':
			break;

		case 'respond_trade':
			break;

		case 'init_roll':
			break;

		case 'win':
			ui.writeLog(p.name + ' won with ' + a[2] + ' points.');
			changeState('idle');
			break;

		case 'register':
			ui.writeLog('Player ' + pid + ' (' + a[2] + ') arrived.');
			return;
			break;

		case 'start_game':
			game.transferTurn(0);
			firstPlayer = 0;
			ui.writeLog('Game started!');
			break;

		case 'map_data':
			if (myId == pid) return;
			a.shift();
			a.shift();
			game.start(new Array('cx', 'Si', 'phisho'), a);
			break;
	}

	ui.refreshWindows(myId);
}
