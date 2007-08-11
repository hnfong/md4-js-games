function Board()
{
	this.WIDTH = 7;
	this.HEIGHT = 7;

	this.data = new Array(this.WIDTH);

	this.data[0] = new Array(0, 0, 0, 2, 2, 2, 2);
	this.data[1] = new Array(0, 0, 2, 1, 1, 1, 2);
	this.data[2] = new Array(0, 2, 1, 1, 1, 1, 2);
	this.data[3] = new Array(2, 1, 1, 1, 1, 1, 2);
	this.data[4] = new Array(2, 1, 1, 1, 1, 2, 0);
	this.data[5] = new Array(2, 1, 1, 1, 2, 0, 0);
	this.data[6] = new Array(2, 2, 2, 2, 0, 0, 0);

	this.cellResources = undefined; // 2D array (same size as board)
	this.cellMarkers = undefined; // 2D array (same size as board)
	this.outcomeCellMap = undefined; // 2D array (outcome -> cell)
	this.robberPos = undefined;
	this.vertexBuildingMap = undefined; // coordinates->building
	this.edgeBuildingMap = undefined; // coordinates->building
	this.vertexReachableMap = undefined; // coordinates->array of player IDs
}

Board.prototype.randomizeCells = function () {
	var remainTiles = new Array(4, 3, 4, 4, 3);
	var numberMarkers = new Array(6, 2, 5, 3, 4, 9, 10, 8, 11, 3, 8, 10, 5, 6, 4, 9, 12, 11);

	this.cellResources = create2DArray(this.WIDTH, this.HEIGHT);
	this.cellMarkers = create2DArray(this.WIDTH, this.HEIGHT);
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
			}
		}
}

Board.prototype.loadMap = function(mapData) {
	this.WIDTH = mapData.shift();
	this.HEIGHT = mapData.shift();
	this.cellResources = create2DArray(board.WIDTH, board.HEIGHT);
	this.cellMarkers = create2DArray(board.WIDTH, board.HEIGHT);
	this.outcomeCellMap = new Array();
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

	var x = mapData.shift();
	var y = mapData.shift();
	board.placeRobber(x, y);
}


Board.prototype.drawBoard = function () {
	for (var i = 0; i < this.WIDTH; ++i)
	for (var j = 0; j < this.HEIGHT; ++j) 
	if (this.data[i][j]) {
		var tile = document.createElement('img');
		if (this.data[i][j] == 2)
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
		marker.style.position = 'absolute';
		marker.style.left = (cellXY(i,j).x + 30 + game.XDELTA) + 'px';
		marker.style.top = (cellXY(i,j).y + 20 + game.YDELTA) + 'px';
		marker.innerHTML = this.cellMarkers[i][j];
		document.getElementById('markers').appendChild(marker);
	}
}

Board.prototype.placeRobber = function(i, j) {
	this.robberPos = { i: i, j: j };
	g('robber').style.left = (cellXY(i, j).x + 45 + game.XDELTA) + 'px';
	g('robber').style.top = (cellXY(i, j).y + 25 + game.YDELTA) + 'px';
	g('robber').style.visibility = 'visible';
};

