function OutgoingTrade(id, from) {
	this.PENDING = 0;
	this.ACCEPTED = 1;
	this.REJECTED = 2;
	this.COUNTER = 3;

	this.id = id;
	this.from = from;
	this.dialog = null;
	this.counter_dialog = null;
}

OutgoingTrade.prototype.setRecipients = function(rec) {
	this.recipients = rec;
	this.status = new Array();
	for (var i = 0; i < rec.length; ++i)
		this.status.push(this.PENDING);
	this.counter_give = new Array();
	for (var i = 0; i < rec.length; ++i)
		this.counter_give.push(new Array());
	this.counter_get = new Array();
	for (var i = 0; i < rec.length; ++i)
		this.counter_get.push(new Array());
}

OutgoingTrade.prototype.setContract = function(give, get) {
	this.give = give;
	this.get = get;
};

OutgoingTrade.prototype.makeDialog = function() {
	var content = '';
	content += '<b>I give:</b><br/>';
	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < this.give.length; ++i) {
		content += '<td><img src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;' + this.give[i] + '&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table><br/>';
	content += '<b>I get:</b><br/>';
	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < this.get.length; ++i) {
		content += '<td><img src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;' + this.get[i] + '&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table><br/>';
	content += '<b>Status:</b><br/>';
	for (var i = 0; i < this.recipients.length; ++i) {
		var k = this.recipients[i];
		content += game.players[k].name + ' <span id="ot_' + this.id + '_' + k + '_status">(Waiting)</span><br/>';
	}
	content += '<br/>';
	content += '<input type="button" class="smallbutton" onclick="game.me.cancelTrade(' + this.id + ');" value="Cancel"> ';

	var d = new Dialog('Outgoing Trade', content);
	d.create();
	d.obj.style.top = '300px';
	d.obj.style.left = '300px';
	d.obj.style.visibility = 'visible';
	this.dialog = d;
};

OutgoingTrade.prototype.propose = function() {
	for (var i = 0; i < this.recipients.length; ++i)
		sendRemoteMessage('trade_propose ' + this.from + ' ' + this.id + ' ' + this.recipients[i] + ' ' + dumpArray(this.give) + ' ' + dumpArray(this.get));
};

OutgoingTrade.prototype.accepted = function(pid) {
	for (var i = 0; i < this.recipients.length; ++i)
		if (this.recipients[i] == pid)
			this.status[i] = this.ACCEPTED;
	g('ot_' + this.id + '_' + pid + '_status').innerHTML = '(Accepted) <input type="button" class="smallbutton" onclick="game.me.trade(' + this.id + ', ' + pid + ');" value="Confirm">';
};

OutgoingTrade.prototype.rejected = function(pid) {
	for (var i = 0; i < this.recipients.length; ++i)
		if (this.recipients[i] == pid)
			this.status[i] = this.REJECTED;
	g('ot_' + this.id + '_' + pid + '_status').innerHTML = '(Rejected)';
};

OutgoingTrade.prototype.counter = function(pid, give, get) {
	for (var i = 0; i < this.recipients.length; ++i)
		if (this.recipients[i] == pid) {
			this.status[i] = this.COUNTER;
			this.counter_give[i] = give;
			this.counter_get[i]  = get;
		}
	g('ot_' + this.id + '_' + pid + '_status').innerHTML = '(Counter) <input type="button" class="smallbutton" onclick="game.me.show_counter_detail(' + this.id + ', ' + pid + ');" value="Show Detail">';
};

OutgoingTrade.prototype.show_counter_detail = function(pid) {
	sendRemoteMessage('trade_cancel ' + this.from + ' ' + this.id);
	this.dialog.obj.style.visibility = 'hidden';
};

OutgoingTrade.prototype.cancel = function() {
	sendRemoteMessage('trade_cancel ' + this.from + ' ' + this.id);
	this.dialog.obj.style.visibility = 'hidden';
};

OutgoingTrade.prototype.finish = function() {
	this.cancel();
}

OutgoingTrade.prototype.hide = function() {
	this.dialog.obj.style.visibility = 'hidden';
}

OutgoingTrade.prototype.show = function() {
	this.dialog.obj.style.visibility = 'visible';
}

function IncomingTrade(id, to, from) {
	this.id = id;
	this.to = to;
	this.from = from;
	this.dialog = null;
}

IncomingTrade.prototype.setContract = function(give, get) {
	this.give = give;
	this.get = get;
};

IncomingTrade.prototype.makeDialog = function() {
	var content = '';
	content += '<b>I give:</b><br/>';
	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < this.give.length; ++i) {
		content += '<td><img src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;' + this.give[i] + '&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table><br/>';
	content += '<b>I get:</b><br/>';
	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < this.get.length; ++i) {
		content += '<td><img src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;' + this.get[i] + '&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table><br/>';
	content += '<input type="button" class="smallbutton" onclick="game.me.acceptTrade(' + this.id + ');" value="Accept"> ';
	content += '<input type="button" class="smallbutton" onclick="game.me.rejectTrade(' + this.id + ');" value="Reject"> ';
	content += '<input type="button" class="smallbutton" onclick="game.me.counterTrade(' + this.id + ');" value="Counter"> ';

	var d = new Dialog('Trade Proposal from ' + game.players[this.from].name, content);
	d.create();
	d.obj.style.top = '300px';
	d.obj.style.left = '300px';
	d.obj.style.visibility = 'visible';
	this.dialog = d;
};

IncomingTrade.prototype.accept = function() {
	sendRemoteMessage('trade_accept ' + this.to + ' ' + this.id + ' ' + this.from);
	this.dialog.obj.style.visibility = 'hidden';
};

IncomingTrade.prototype.reject = function() {
	sendRemoteMessage('trade_reject ' + this.to + ' ' + this.id + ' ' + this.from);
	this.dialog.obj.style.visibility = 'hidden';
};

IncomingTrade.prototype.counter = function() {
	counterProposeDialog.show(this, this.to, this.id, this.from);
	this.dialog.obj.style.visibility = 'hidden';
};

IncomingTrade.prototype.canceled = function() {
	this.dialog.obj.style.visibility = 'hidden';
};

IncomingTrade.prototype.hide = function() {
	this.dialog.obj.style.visibility = 'hidden';
};

IncomingTrade.prototype.show = function() {
	this.dialog.obj.style.visibility = 'visible';
};

function IncomingCounter(id, to, from, parent) {
	this.id = id;
	this.to = to;
	this.from = from;
	this.parent = parent;
	this.dialog = null;
}

IncomingCounter.prototype.setContract = function(give, get) {
	this.give = give;
	this.get = get;
};

IncomingCounter.prototype.makeDialog = function() {
	var content = '';
	content += '<b>I give:</b><br/>';
	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < this.give.length; ++i) {
		content += '<td><img src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;' + this.give[i] + '&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table><br/>';
	content += '<b>I get:</b><br/>';
	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < this.get.length; ++i) {
		content += '<td><img src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;' + this.get[i] + '&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table><br/>';
	content += '<input type="button" class="smallbutton" onclick="game.me.acceptCounter(' + this.id + ', ' + this.from + ');" value="Accept"> ';
	content += '<input type="button" class="smallbutton" onclick="game.me.cancelCounter(' + this.id + ', ' + this.from + ');" value="Cancel"> ';

	var d = new Dialog('Counter Proposal from ' + game.players[this.from].name, content);
	d.create();
	d.obj.style.top = '300px';
	d.obj.style.left = '300px';
	d.obj.style.visibility = 'visible';
	this.dialog = d;
};

IncomingCounter.prototype.hide = function() {
	this.dialog.obj.style.visibility = 'hidden';
};

IncomingCounter.prototype.show = function() {
	this.dialog.obj.style.visibility = 'visible';
};
