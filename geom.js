// axes:
//
//  |\
//  | \
//  |  \
//  |   \
//  j    i
//




//
//  Vertex order
//
//    0--1
//   /    \
//  5      2
//   \    /
//    4--3
//

var commonVertex = new Array(6);
commonVertex[0] = new Array(2);
commonVertex[0][0] = { i: -1, j: 0, v: 2 };
commonVertex[0][1] = { i: 0, j: -1, v: 4 };
commonVertex[1] = new Array(2);
commonVertex[1][0] = { i: 0, j: -1, v: 3 };
commonVertex[1][1] = { i: 1, j: -1, v: 5 };
commonVertex[2] = new Array(2);
commonVertex[2][0] = { i: 1, j: -1, v: 4 };
commonVertex[2][1] = { i: 1, j: 0, v: 0 };
commonVertex[3] = new Array(2);
commonVertex[3][0] = { i: 1, j: 0, v: 5 };
commonVertex[3][1] = { i: 0, j: 1, v: 1 };
commonVertex[4] = new Array(2);
commonVertex[4][0] = { i: 0, j: 1, v: 0 };
commonVertex[4][1] = { i: -1, j: 1, v: 2 };
commonVertex[5] = new Array(2);
commonVertex[5][0] = { i: -1, j: 1, v: 1 };
commonVertex[5][1] = { i: -1, j: 0, v: 3 };

//
//  Edge order
//
//      0
//      --
//  5 /    \ 1
//  4 \    / 2
//      --
//      3
//

var commonEdge = new Array(6);
commonEdge[0] = { i: 0, j: -1, e: 3 };
commonEdge[1] = { i: 1, j: -1, e: 4 };
commonEdge[2] = { i: 1, j: 0, e: 5 };
commonEdge[3] = { i: 0, j: 1, e: 0 };
commonEdge[4] = { i: -1, j: 1, e: 1 };
commonEdge[5] = { i: -1, j: 0, e: 2 };

function isInRange(i, j) {
	return i >= 0 && i < board.WIDTH && j >= 0 && j < board.HEIGHT;
}


function isValidCell(i, j) {
	return isInRange(i, j) && board.data[i][j] == 1;
}

function isValidVertex(i, j, v) {
	if (isValidCell(i, j))
		return true;
	var cv1 = commonVertex[v][0];
	if (isValidCell(i + cv1.i, j + cv1.j))
		return true;
	var cv2 = commonVertex[v][1];
	return isValidCell(i + cv2.i, j + cv2.j);
}

function isValidEdge(i, j, e) {
	if (isValidCell(i, j))
		return true;
	return isValidCell(i + commonEdge[e].i, j + commonEdge[e].j);
}

function canonicalVertex(i, j, v) {
	if (v < 2)
		return {i: i, j: j, v: v};
	var cv1 = commonVertex[v][0];
	if (cv1.v < 2)
		return { i: i+cv1.i, j: j+cv1.j, v: cv1.v };
	var cv2 = commonVertex[v][1];
	return { i: i+cv2.i, j: j+cv2.j, v: cv2.v };
}

function canonicalEdge(i, j, e) {
	if (e < 3)
		return { i: i, j: j, e: e };
	var ce = commonEdge[e];
	return { i: i + ce.i, j: j + ce.j, e: ce.e };
}

function isSameVertex(i1, j1, v1, i2, j2, v2) {
	var canon1 = canonicalVertex(i1, j1, v1);
	var canon2 = canonicalVertex(i2, j2, v2);
	return canon1.i == canon2.i && canon1.j == canon2.j && canon1.v == canon2.v;
}

function isSameEdge(i1, j1, e1, i2, j2, e2) {
	var canon1 = canonicalEdge(i1, j1, e1);
	var canon2 = canonicalEdge(i2, j2, e2);
	return canon1.i == canon2.i && canon1.j == canon2.j && canon1.e == canon2.e;
}

function cellXY(i, j) {
	var x = 50 + 54 * i;
	var y = 50 + 32 * i + 64 * j;
	return { x: x, y: y };
}


function vertexXY(i, j, v) {
	var cxy = cellXY(i, j);
	switch (v) {
		case 0: return { x: cxy.x+18, y: cxy.y }; 
		case 1: return { x: cxy.x+52, y: cxy.y }; 
		case 2: return { x: cxy.x+71, y: cxy.y+31 }; 
		case 3: return { x: cxy.x+52, y: cxy.y+63 }; 
		case 4: return { x: cxy.x+18, y: cxy.y+63 }; 
		case 5: return { x: cxy.x, y: cxy.y+31 }; 
	}
}


function vertexToString(i, j, v) {
	var o = canonicalVertex(i, j, v);
	return o.i + "," + o.j + "," + o.v;
}


function edgeToString(i, j, e) {
	var o = canonicalEdge(i, j, e);
	return o.i + "," + o.j + "," + o.e;
}
