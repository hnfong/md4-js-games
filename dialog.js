function Dialog(title, content)
{
	this.title = title;
	this.content = content;
}

Dialog.prototype.create = function()
{
	var x = g('dialogs');

	var b = document.createElement("DIV");
	b.setAttribute('class', 'dialog_base');

	x.appendChild(b);

	var s = '';
	s +=  '<div class="dialog_title">'+this.title+'</div>';
	s +=  '<div class="dialog_main">'+this.content+'</div>';

	b.innerHTML = s;

	this.obj = b;

	return b;
}

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

	plentyDialog.show = function() {
		plentyDialog.obj.style.visibility = 'visible';
		this.clear();
	};

	plentyDialog.hide = function() {
		this.obj.style.visibility = 'hidden';
	};

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
		sendRemoteMessage("get_resources " + game.me.id + r);
		game.me.addResources(this.resources);
		ui.refreshWindows(game.me.id);
		this.hide();
	};
}

function dialog_init() {
	plentyDialog_init();
}
