function Dialog(title, content)
{
	this.title = title;
	this.content = content;
}

Dialog.prototype.create = function()
{
	var x = g('dialogs');

	var b = document.createElement("DIV");
	b.className = 'dialog_base';

	x.appendChild(b);

	var s = '';
	s +=  '<div class="dialog_title">'+this.title+'</div>';
	s +=  '<div class="dialog_main">'+this.content+'</div>';

	b.innerHTML = s;

	this.obj = b;

	return b;
};

Dialog.prototype.hide = function() {
	this.obj.style.visibility = 'hidden';
};

Dialog.prototype.show = function() {
	this.obj.style.visibility = 'visible';
	this.clear();
};

Dialog.prototype.dispose = function() {
	var x = g('dialogs');
	x.removeChild(this.obj);
};


var plentyDialog;

function plentyDialog_init() {
	var content = '';
	content += '<table cellspacing="6" cellpadding="0" border="0">';
	content +=  '<tr>';
	for (var i = 0 ; i < game.resourceNames.length; i++)
	{
		content += '<td><img onclick="plentyDialog.inc('+i+');" src="img/'+game.resourceNames[i]+'_small.gif">&nbsp;<span id="plenty_'+i+'_value">0</span>&nbsp;&nbsp;</td>';
	}
	content +=  '</tr>';
	content += '</table>';
	content += '<div align="center"><input type="button" class="smallbutton" onclick="plentyDialog.clear()" value="Clear"> <input type="button" class="smallbutton" onclick="plentyDialog.confirm()" value="Confirm"></div>';
	plentyDialog = new Dialog('Choose two resources', content);
	plentyDialog.create();
	plentyDialog.obj.style.top = "100px";
	plentyDialog.obj.style.left = "100px";


	plentyDialog.refresh = function(res) {
		for (var i = 0 ; i < game.numResourceTypes; i++) {
			g('plenty_' + i + '_value').innerHTML = this.resources[i];
		}
	};

	plentyDialog.count = function() {
		var z = 0;
		for (var i = 0 ; i < game.numResourceTypes; i++) {
			z += this.resources[i];
		}
		return z;
	};

	plentyDialog.inc = function(res) {
		if (this.count() >= 2) return false;

		this.resources[res] ++;
		this.refresh();
	};

	plentyDialog.clear = function() {
		plentyDialog.resources = new Array();
		for (var i = 0 ; i < game.numResourceTypes; i++) {
			plentyDialog.resources.push(0);
		}
		this.refresh();
	};

	plentyDialog.confirm = function() {
		if (this.count() != 2) {
			alert("You must choose two resources!");
			return false;
		}
		var r = '';
		for (var i = 0 ; i < game.numResourceTypes; i++) {
			r += ' ' + this.resources[i];
		}
		dispatchMessage('get_resources', this.resources);
		this.hide();
	};
}

var monopolyDialog;

function monopolyDialog_init() {
	var content = '';
	content += '<table cellspacing="6" cellpadding="0" border="0">';
	content +=  '<tr>';
	for (var i = 0 ; i < game.resourceNames.length; i++)
	{
		content += '<td><img onclick="monopolyDialog.choose('+i+');" src="img/'+game.resourceNames[i]+'_small.gif">&nbsp;<span id="monopoly_'+i+'_value">0</span>&nbsp;&nbsp;</td>';
	}
	content +=  '</tr>';
	content += '</table>';
	content += '<div align="center"><input type="button" class="smallbutton" onclick="monopolyDialog.clear()" value="Clear"> <input type="button" class="smallbutton" onclick="monopolyDialog.confirm()" value="Confirm"></div>';
	monopolyDialog = new Dialog('Choose a resource type to monopoly', content);
	monopolyDialog.create();
	monopolyDialog.obj.style.top = "100px";
	monopolyDialog.obj.style.left = "100px";

	monopolyDialog.refresh = function(res) {
		for (var i = 0 ; i < game.numResourceTypes; i++) {
			g('monopoly_' + i + '_value').innerHTML = this.resources[i];
		}
	};

	monopolyDialog.count = function() {
		var z = 0;
		for (var i = 0 ; i < game.numResourceTypes; i++) {
			z += this.resources[i];
		}
		return z;
	};

	monopolyDialog.choose = function(res) {
		for (var i = 0 ; i < game.numResourceTypes; i++) {
			this.resources[i] = 0;
		}
		this.resources[res] ++;
		this.refresh();
	};

	monopolyDialog.clear = function() {
		monopolyDialog.resources = new Array();
		for (var i = 0 ; i < game.numResourceTypes; i++) {
			monopolyDialog.resources.push(0);
		}
		this.refresh();
	};

	monopolyDialog.confirm = function() {
		if (this.count() != 1) {
			alert("You must choose a resource type!");
			return false;
		}
		var type = -1;
		for (var i = 0 ; i < game.numResourceTypes; i++) {
			if (this.resources[i] > 0) type = i;
		}

		dispatchMessage('monopoly', [type]);
		this.hide();
	};
}

var discardDialog;

function discardDialog_init() {
	var content = '';

	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < game.resourceNames.length; ++i) {
		content += '<td><img onclick="discardDialog.inc(' + i + ');" src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;<span id="discard_' + i + '_value">0</span>&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table>';
	content += '<div align="center"><input type="button" class="smallbutton" onclick="discardDialog.clear()" value="Clear"> <input type="button" class="smallbutton" onclick="discardDialog.confirm()" value="Confirm"></div>';

	var title = 'Discard <span id="discard_num_cards">0</span> resource cards';
	discardDialog = new Dialog(title, content);
	discardDialog.create();
	discardDialog.obj.style.top = "100px";
	discardDialog.obj.style.left = "100px";

	discardDialog.show = function(numCards) {
		this.obj.style.visibility = 'visible';
		this.numCards = numCards;
		g('discard_num_cards').innerHTML = numCards;
		this.clear();
	};

	discardDialog.refresh = function(res) {
		for (var i = 0 ; i < game.numResourceTypes; ++i) {
			g('discard_' + i + '_value').innerHTML = this.resources[i];
		}
	};

	discardDialog.count = function() {
		var z = 0;
		for (var i = 0; i < game.numResourceTypes; ++i) {
			z += this.resources[i];
		}
		return z;
	};

	discardDialog.inc = function(res) {
		this.resources[res] = (this.resources[res] + 1) % (game.me.resources[res] + 1);
		this.refresh();
	};

	discardDialog.clear = function() {
		discardDialog.resources = new Array();
		for (var i = 0; i < game.numResourceTypes; ++i) {
			discardDialog.resources.push(0);
		}
		this.refresh();
	}

	discardDialog.confirm = function() {
		if (this.count() != this.numCards) {
			alert('You must discard ' + this.numCards + ' resource cards!');
			return false;
		}
		dispatchMessage('discard', this.resources);
		this.hide();
	}
}

var tradeProposeDialog;

function tradeProposeDialog_init() {
	var content = '';
	content += '<b>I give:</b><br/>';
	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < game.resourceNames.length; ++i) {
		content += '<td><img onclick="tradeProposeDialog.incGive(' + i + ');" src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;<span id="trade_propose_give_' + i + '_value">0</span>&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table><br/>';
	content += '<b>I get:</b><br/>';
	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < game.resourceNames.length; ++i) {
		content += '<td><img onclick="tradeProposeDialog.incGet(' + i + ');" src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;<span id="trade_propose_get_' + i + '_value">0</span>&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table><br/>';
	content += '<b>Send to:</b><br/>';
	for (var i = 0; i < game.numPlayers; ++i)
		if (i != game.me.id)
			content += '<input type="checkbox" id="trade_propose_' + i + '_check"> ' + game.players[i].name + '<br/>';
	content += '<br/>';
	content += '<div align="center"><input type="button" class="smallbutton" onclick="tradeProposeDialog.clear()" value="Clear"> <input type="button" class="smallbutton" onclick="tradeProposeDialog.tradePlayer();" value="Trade"> <input type="button" class="smallbutton" onclick="tradeProposeDialog.tradeBankPort();" value="Bank/Port"> <input type="button" class="smallbutton" onclick="tradeProposeDialog.hide();" value="Cancel"></div>';

	tradeProposeDialog = new Dialog('Trade', content);
	tradeProposeDialog.create();
	tradeProposeDialog.obj.style.top = "100px";
	tradeProposeDialog.obj.style.left = "100px";

	tradeProposeDialog.refresh = function(res) {
		for (var i = 0 ; i < game.numResourceTypes; ++i) {
			g('trade_propose_give_' + i + '_value').innerHTML = this.give[i];
			g('trade_propose_get_' + i + '_value').innerHTML = this.get[i];
		}
	};

	tradeProposeDialog.incGive = function(res) {
		if (this.give[res] < game.me.resources[res])
			this.give[res]++;
		this.refresh();
	};

	tradeProposeDialog.incGet = function(res) {
		this.get[res]++;
		this.refresh();
	};

	tradeProposeDialog.clear = function() {
		this.give = new Array();
		this.get = new Array();
		for (var i = 0; i < game.numResourceTypes; ++i) {
			this.give.push(0);
			this.get.push(0);
		}
		this.refresh();
	}

	tradeProposeDialog.tradeBankPort = function() {
		var giveWhat = -1;
		for (var i = 0; i < game.numResourceTypes; ++i)
			if (this.give[i] > 0) {
				if (giveWhat >= 0) {
					alert('Only one type of resources is allowed!');
					return false;
				}
				giveWhat = i;
			}
		var getWhat = -1;
		for (var i = 0; i < game.numResourceTypes; ++i)
			if (this.get[i] > 0) {
				if (getWhat >= 0) {
					alert('Only one type of resources is allowed!');
					return false;
				}
				getWhat = i;
			}
		if (giveWhat < 0 || getWhat <0) {
			alert('You must specify at least one type of resources!');
			return false;
		}
		var rate = game.me.tradeRates[giveWhat];
		if (this.give[giveWhat] != this.get[getWhat] * rate) {
			alert('You have to give ' + (this.get[getWhat] * rate) + ' ' + game.resourceNames[giveWhat] + '!');
			return false;
		}
		var a = [];
		util.concat_array(a, this.give);
		util.concat_array(a, this.get);
		dispatchMessage('trade_self', a);
		this.hide();
	};

	tradeProposeDialog.tradePlayer = function() {
		{
			var empty = true;
			for (var i = 0; i < game.numResourceTypes; ++i)
				if (this.give[i] > 0)
					empty = false;
			if (empty) {
				alert('Both parties must give something!');
				return false;
			}
		}
		{
			var empty = true;
			for (var i = 0; i < game.numResourceTypes; ++i)
				if (this.get[i] > 0)
					empty = false;
			if (empty) {
				alert('Both parties must give something!');
				return false;
			}
		}
		var recipients = new Array();
		for (var i = 0; i < game.numPlayers; ++i) {
			if (i != game.me.id && g('trade_propose_' + i + '_check').checked)
				recipients.push(i);
}
		if (recipients.length == 0) {
			alert('You must specify at least one recipient!');
			return false;
		}
		game.me.proposeTrade(this.give, this.get, recipients);
		ui.refreshWindows(game.me.id);
		this.hide();
	};
}

var counterProposeDialog;

function counterProposeDialog_init() {
	var content = '';
	content += '<b>I give:</b><br/>';
	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < game.resourceNames.length; ++i) {
		content += '<td><img onclick="counterProposeDialog.incGive(' + i + ');" src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;<span id="counter_propose_give_' + i + '_value">0</span>&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table><br/>';
	content += '<b>I get:</b><br/>';
	content += '<table cellspaing="6" cellpadding="0" border="0">';
	content += '<tr>';
	for (var i = 0; i < game.resourceNames.length; ++i) {
		content += '<td><img onclick="counterProposeDialog.incGet(' + i + ');" src="img/' + game.resourceNames[i] + '_small.gif">&nbsp;<span id="counter_propose_get_' + i + '_value">0</span>&nbsp;&nbsp;</td>';
	}
	content += '</tr>';
	content += '</table><br/>';
	content += '<div align="center"><input type="button" class="smallbutton" onclick="counterProposeDialog.clear()" value="Clear"> <input type="button" class="smallbutton" onclick="counterProposeDialog.tradePlayer();" value="Trade"> <input type="button" class="smallbutton" onclick="counterProposeDialog.cancel();" value="Cancel"></div>';

	counterProposeDialog = new Dialog('Counter Proposal', content);
	counterProposeDialog.create();
	counterProposeDialog.obj.style.top = "100px";
	counterProposeDialog.obj.style.left = "100px";

	counterProposeDialog.show = function(parent, from, id, to) {
		this.obj.style.visibility = 'visible';
		this.parent = parent;
		this.from = from;
		this.id = id;
		this.to = to;
		this.clear();
	};

	counterProposeDialog.refresh = function(res) {
		for (var i = 0 ; i < game.numResourceTypes; ++i) {
			g('counter_propose_give_' + i + '_value').innerHTML = this.give[i];
			g('counter_propose_get_' + i + '_value').innerHTML = this.get[i];
		}
	};

	counterProposeDialog.incGive = function(res) {
		if (this.give[res] < game.me.resources[res])
			this.give[res]++;
		this.refresh();
	};

	counterProposeDialog.incGet = function(res) {
		this.get[res]++;
		this.refresh();
	};

	counterProposeDialog.clear = function() {
		this.give = new Array();
		this.get = new Array();
		for (var i = 0; i < game.numResourceTypes; ++i) {
			this.give.push(0);
			this.get.push(0);
		}
		this.refresh();
	}

	counterProposeDialog.tradePlayer = function() {
		{
			var empty = true;
			for (var i = 0; i < game.numResourceTypes; ++i)
				if (this.give[i] > 0)
					empty = false;
			if (empty) {
				alert('Both parties must give something!');
				return false;
			}
		}
		{
			var empty = true;
			for (var i = 0; i < game.numResourceTypes; ++i)
				if (this.get[i] > 0)
					empty = false;
			if (empty) {
				alert('Both parties must give something!');
				return false;
			}
		}
		var recipients = new Array();

		var a = new Array();
		a.push(this.id);
		a.push(this.to);
		util.concat_array(a, this.give);
		util.concat_array(a, this.get);
		dispatchMessage('counter_propose', a);
		ui.refreshWindows(game.me.id);
		this.parent.setContract(this.give, this.get);
		this.hide();
	};

	counterProposeDialog.cancel = function() {
		this.hide();
		this.parent.show();
	};
}

function dialog_init() {
	// tradeProposeDialog & counterProposeDialog gets initialized in game.start()
	plentyDialog_init();
	monopolyDialog_init();
	discardDialog_init();
}

