function debug(txt)
{
	var x = document.createElement('div');
	x.innerHTML = txt;
	document.body.appendChild(x);
}

function randInt(n) {
	return Math.floor(Math.random() * n);
}

function roll() {
	var a = new Array();
	for (var i = 0; i < game.numDice; ++i)
		a.push(randInt(game.numDiceFaces) + 1);
	return a;
}

function create1DArray(w) {
	var a = new Array(w);
	for (var i = 0; i < w; ++i)
		a[i] = 0;
	return a;
}

function create2DArray(w, h) {
	var a = new Array(w);
	for (var i = 0; i < w; ++i) {
		a[i] = new Array(h);
		for (var j = 0; j < h; ++j)
			a[i][j] = 0;
	}
	return a;
}

function hasEnoughResources(res, cost) {
	for (var i = 0; i < res.length; ++i)
		if (res[i] < cost[i])
			return false;
	return true;
}


function vertexOwner(i, j, v) {
	var s = vertexToString(i, j, v);
	if (!vertexBuildingMap[s]) return -1;
	return vertexBuildingMap[s].owner;
}

function vertexBuilding(i, j, v) {
	var s = vertexToString(i, j, v);
	if (!vertexBuildingMap[s]) return false;
	return vertexBuildingMap[s];
}

function g(x) {
	return document.getElementById(x);
}

function resourcesToString(a) {
	var txt = '';
	for (var j = 0; j < game.numResourceTypes; ++j)
		if (a[j] > 0)
			txt += ', ' + a[j] + ' ' + game.resourceNames[j];
	if (txt == '')
		txt = '  nothing';
	return txt.substr(2);
}

function isArray(a) {
	return (typeof a == 'object' && a.constructor.toString().match(/array/i) != null);
}

function dumpArray(a) {
	if (!isArray(a))
		return '' + a;
	var s = '';
	for (var i = 0; i < a.length; ++i)
		s += ' ' + dumpArray(a[i]);
	return s.substr(1);
}
