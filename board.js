function Board()
{
	this.WIDTH = 7;
	this.HEIGHT = 7;

	// this.data
	this.LAND = 1;
	this.SEA = 2;
	this.PORT = 3;

	// this.vertexPortMap
	this.WILDCARD_PORT = -1;

	this.data = new Array(this.WIDTH);

	this.data[0] = new Array(0, 0, 0, 3, 2, 3, 2);
	this.data[1] = new Array(0, 0, 2, 1, 1, 1, 3);
	this.data[2] = new Array(0, 3, 1, 1, 1, 1, 2);
	this.data[3] = new Array(2, 1, 1, 1, 1, 1, 3);
	this.data[4] = new Array(3, 1, 1, 1, 1, 2, 0);
	this.data[5] = new Array(2, 1, 1, 1, 3, 0, 0);
	this.data[6] = new Array(3, 2, 3, 2, 0, 0, 0);

	this.cellResources = null; // 2D array (same size as board)
	this.cellMarkers = null; // 2D array (same size as board)
	this.outcomeCellMap = null; // 2D array (outcome -> cell)
	this.robberPos = null;
	this.vertexBuildingMap = null; // coordinates->building
	this.edgeBuildingMap = null; // coordinates->building
	this.vertexReachableMap = null; // coordinates->array of player IDs
	this.cellPorts = null // 2D array (same size as board)
	this.vertexPortMap = null; // coordinates->port
}

Board.prototype.randomizeCells = function () {
	var remainTiles = new Array(4, 3, 4, 4, 3);
	var numberMarkers = new Array(6, 2, 5, 3, 4, 9, 10, 8, 11, 3, 8, 10, 5, 6, 4, 9, 12, 11);
	var remainPorts = new Array(-1, -1, -1, -1, 0, 1, 2, 3, 4);

	this.cellResources = create2DArray(this.WIDTH, this.HEIGHT);
	this.cellMarkers = create2DArray(this.WIDTH, this.HEIGHT);
	this.cellPorts = create2DArray(this.WIDTH, this.HEIGHT);
	this.vertexPortMap = new Array();
	this.outcomeCellMap = new Array();
	this.robberPos = { i: -999, j: -999 };

	while (true) {
		var i = randInt(this.WIDTH);
		var j = randInt(this.HEIGHT);
		if (isValidCell(i, j)) {
			this.cellResources[i][j] = game.DESERT;
			board.placeRobber(i, j);
			break;
		}
	}

	for (var i = 0; i < this.WIDTH; ++i)
		for (var j = 0; j < this.HEIGHT; ++j) {
			if (isValidCell(i, j) && this.cellResources[i][j] != game.DESERT) {
				while (true) {
					var type = randInt(game.numResourceTypes);
					if (remainTiles[type] > 0) {
						this.cellResources[i][j] = type;
						remainTiles[type]--;
						break;
					}
				}
				while (true) {
					var mark = randInt(numberMarkers.length);
					var m = numberMarkers[mark];
					if (m > 0) {
						this.cellMarkers[i][j] = m;
						numberMarkers[mark] = 0;
						if (!this.outcomeCellMap[m])
							this.outcomeCellMap[m] = new Array();
						this.outcomeCellMap[m].push( {i: i, j: j} );
						break;
					}
				}
			} else if (this.data[i][j] == this.PORT) {
				while (true) {
					var index = randInt(remainPorts.length);
					if (remainPorts[index] != null) {
						while (true) {
							var dir = randInt(6);
							if (!isValidVertex(i, j, dir) || !isValidVertex(i, j, (dir+1)%6)) continue;
							var type = remainPorts[index];
							var rate = (type == this.WILDCARD_PORT) ? 3 : 2;
							this.cellPorts[i][j] = { type: type, dir: dir, rate: rate };
							this.vertexPortMap[vertexToString(i, j, dir)] = { type: type, rate: rate };
							this.vertexPortMap[vertexToString(i, j, (dir+1)%6)] = { type: type, rate: rate };
							break;								
						}
						remainPorts[index] = null;
						break;
					}
				}	
			}
		}
}

Board.prototype.loadMap = function(mapData) {
	this.WIDTH = mapData.shift();
	this.HEIGHT = mapData.shift();
	this.cellResources = create2DArray(board.WIDTH, board.HEIGHT);
	this.cellMarkers = create2DArray(board.WIDTH, board.HEIGHT);
	this.cellPorts = create2DArray(board.WIDTH, board.HEIGHT);
	this.outcomeCellMap = new Array();
	this.vertexPortMap = new Array();
	this.robberPos = { i: -999, j: -999 };

	for (var i = 0; i < this.WIDTH; ++i)
		for (var j = 0; j < this.HEIGHT; ++j)
			this.data[i][j] = parseInt(mapData.shift());

	for (var i = 0; i < this.WIDTH; ++i)
		for (var j = 0; j < this.HEIGHT; ++j)
			this.cellResources[i][j] = parseInt(mapData.shift());

	for (var i = 0; i < this.WIDTH; ++i)
		for (var j = 0; j < this.HEIGHT; ++j) {
			var m = this.cellMarkers[i][j] = parseInt(mapData.shift());
			if (!this.outcomeCellMap[m])
				this.outcomeCellMap[m] = new Array();
			this.outcomeCellMap[m].push( {i: i, j: j} );
		}

	for (var i = 0; i < this.WIDTH; ++i)
		for (var j = 0; j < this.HEIGHT; ++j) {
			var type = parseInt(mapData.shift());
			var dir = parseInt(mapData.shift());
			var rate = parseInt(mapData.shift());
			this.cellPorts[i][j] = { type: type, dir: dir, rate: rate };
			if (this.data[i][j] == this.PORT) {
				this.vertexPortMap[vertexToString(i, j, dir)] = { type: type, rate: rate };
				this.vertexPortMap[vertexToString(i, j, (dir+1)%6)] = { type: type, rate: rate };			
			}
		}

	var x = mapData.shift();
	var y = mapData.shift();
	board.placeRobber(x, y);
}


Board.prototype.drawBoard = function () {
	for (var i = 0; i < this.WIDTH; ++i)
	for (var j = 0; j < this.HEIGHT; ++j) 
	if (this.data[i][j]) {
		var tile = document.createElement('img');
		if (this.data[i][j] == this.SEA || this.data[i][j] == this.PORT)
			tile.setAttribute('src', 'img/sea.gif');
		else if (this.cellResources[i][j] == game.DESERT)
			tile.setAttribute('src', 'img/desert.gif');
		else
			tile.setAttribute('src', 'img/' + game.resourceNames[this.cellResources[i][j]] + '.gif');
		tile.style.position = 'absolute';
		tile.style.left = (cellXY(i,j).x + game.XDELTA) + 'px';
		tile.style.top = (cellXY(i,j).y + game.YDELTA) + 'px';
		document.getElementById('tiles').appendChild(tile);
	}
}

Board.prototype.drawMarkers = function () {
	for (var i = 0; i < this.WIDTH; ++i)
	for (var j = 0; j < this.HEIGHT; ++j) 
	if (this.cellMarkers[i][j] > 0) {
		var marker = document.createElement('div');
		marker.style.backgroundColor = '#ffffff';			
		if (this.cellMarkers[i][j] == 6 || this.cellMarkers[i][j] == 8) {
			marker.style.color = '#ff0000';
			marker.style.fontWeight = 'bold';
		}
		marker.style.position = 'absolute';
		marker.style.left = (cellXY(i,j).x + 30 + game.XDELTA) + 'px';
		marker.style.top = (cellXY(i,j).y + 20 + game.YDELTA) + 'px';
		marker.innerHTML = this.cellMarkers[i][j];
		document.getElementById('markers').appendChild(marker);
	}
}

Board.prototype.drawPorts = function() {
	for (var i = 0; i < this.WIDTH; ++i)
	for (var j = 0; j < this.HEIGHT; ++j) 
	if (this.data[i][j] == this.PORT) {
		var port = this.cellPorts[i][j];

		for (var k = 0; k < 2; ++k) {
			var v = (port.dir + k) % 6;
			var line = document.createElement('img');
			line.setAttribute('src', 'img/port' + v + '.gif');
			line.style.position = 'absolute';
			line.style.left = (cellXY(i,j).x + game.XDELTA) + 'px';
			line.style.top = (cellXY(i,j).y + game.YDELTA) + 'px';
			document.getElementById('ports').appendChild(line);
		}

		var icon = document.createElement('img');
		if (port.type == this.WILDCARD_PORT)
			icon.setAttribute('src', 'img/wildcard_small.gif');
		else
			icon.setAttribute('src', 'img/' + game.resourceNames[port.type] + '_small.gif');
		icon.style.position = 'absolute';
		icon.style.left = (cellXY(i,j).x + 28 + game.XDELTA) + 'px';
		icon.style.top = (cellXY(i,j).y + 25 + game.YDELTA) + 'px';
		document.getElementById('ports').appendChild(icon);
	}
}

Board.prototype.placeRobber = function(i, j) {
	this.robberPos = { i: i, j: j };
	g('robber').style.left = (cellXY(i, j).x + 45 + game.XDELTA) + 'px';
	g('robber').style.top = (cellXY(i, j).y + 25 + game.YDELTA) + 'px';
	g('robber').style.visibility = 'visible';
};

