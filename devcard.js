var devCardBase = new Array();

function DevCard(id, name, quantity) {
	this.id = id;
	this.name = name;
	this.quantity = quantity;
	this.description = '';
	this.use = function() {};

	this.take = function() {
		this.quantity--;
		return this;
	};

	this.put = function() {
		this.quantity++;
	};

}

function remainingDevCards() {
	var total = 0;
	for (var i = 0; i < devCardBase.length; ++i)
		total += devCardBase[i].quantity;
	return total;
}

function drawDevCard() {
	var total = remainingDevCards();
	var r = randInt(total) + 1;
	for (var i = 0; i < devCardBase.length; ++i) {
		for (var j = 0; j < devCardBase[i].quantity; ++j) {
			r--;
			if (r == 0) {
				r = i;
				i = devCardBase.length;
				break;
			}
		}
	}
	return r;
}

{
	var soldier = new DevCard(0, 'Soldier', 14);
	soldier.use = function() {
		changeState('place_robber');
	};
	devCardBase.push(soldier);
}

{
	var onepoint = new DevCard(1, 'One Victory Point', 5);
	onepoint.use = function() {
		priv_adjustExtraPoints(+1);
	};
	devCardBase.push(onepoint);
}

