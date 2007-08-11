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
}
