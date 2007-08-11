var ui = new Object();

/* creates the image map of cells */
ui.initCellMap = function() {
	for (var i = 0; i < board.WIDTH; ++i)
	for (var j = 0; j < board.HEIGHT; ++j)
	if (isValidCell(i, j)) {
		var area = document.createElement('area');
		var x = cellXY(i,j).x;
		var y = cellXY(i,j).y;
		area.setAttribute('shape', 'polygon');
		area.setAttribute('coords', (x+18) + ',' + (y) + ',' +
		                            (x+52) + ',' + (y) + ',' +
		                            (x+71) + ',' + (y+31) + ',' +
		                            (x+52) + ',' + (y+63) + ',' +
		                            (x+18) + ',' + (y+63) + ',' +
		                            (x) + ',' + (y+31));
		area.setAttribute('onmousedown', 'state.cellHandler('+i+','+j+');return false;');
		document.getElementById('cellmap').appendChild(area);
	}
};

/* creates the image map of vertices */
ui.initVertexMap = function() {
	for (var i = -1; i <= board.WIDTH; ++i)
	for (var j = -1; j <= board.HEIGHT; ++j)
	for (var v = 0; v < 2; ++v)
	if (isValidVertex(i, j, v)) {
		var area = document.createElement('area');
		var x = vertexXY(i,j,v).x;
		var y = vertexXY(i,j,v).y;
		area.setAttribute('shape', 'rect');
		area.setAttribute('coords', (x-12) + ',' + (y-12) + ',' +
		                            (x+12) + ',' + (y+12));
		area.setAttribute('onmousedown', 'state.vertexHandler('+i+','+j+','+v+');return false;');
		document.getElementById('vertexmap').appendChild(area);
	}
}

/* creates the image map of edges */
ui.initEdgeMap = function() {
	for (var i = -1; i <= board.WIDTH; ++i)
	for (var j = -1; j <= board.HEIGHT; ++j)
	for (var e = 0; e < 3; ++e)
	if (isValidEdge(i, j, e)) {
		var area = document.createElement('area');
		var x1 = vertexXY(i,j,e).x;
		var y1 = vertexXY(i,j,e).y;
		var x2 = vertexXY(i,j,(e+1)%6).x;
		var y2 = vertexXY(i,j,(e+1)%6).y;
		area.setAttribute('shape', 'polygon');
		switch (e) {
			case 0:
				area.setAttribute('coords', (x1+5) + ',' + (y1-7) + ',' +
				                            (x2-5) + ',' + (y2-7) + ',' +
				                            (x2-5) + ',' + (y2+7) + ',' +
				                            (x1+5) + ',' + (y1+7));
				break;
			case 1:
				area.setAttribute('coords', (x1+9) + ',' + (y1+2) + ',' +
				                            (x2+1) + ',' + (y2-9) + ',' +
				                            (x2-9) + ',' + (y2-2) + ',' +
				                            (x1-1) + ',' + (y1+9));
				break;
			case 2:
				area.setAttribute('coords', (x1+1) + ',' + (y1+9) + ',' +
				                            (x2+9) + ',' + (y2-2) + ',' +
				                            (x2-1) + ',' + (y2-9) + ',' +
				                            (x1-9) + ',' + (y1+2));
				break;
		}
		area.setAttribute('onmousedown', 'state.edgeHandler('+i+','+j+','+e+');return false;');
		document.getElementById('edgemap').appendChild(area);
	}
}

