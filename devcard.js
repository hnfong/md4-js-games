// abstract,base class
function DevCard(id, name, description) { this.construct(id, name, description); }

DevCard.prototype.construct = function(id,name,description)
{
	this.id = id;
	this.name = name;
	this.description = description;
};


/*************************** Soldier ***************************/
function SoldierCard(id) { DevCard.prototype.construct.call(this, id, "Soldier", "SOLDIER CARD DESCRIPTION. FIXME."); }
SoldierCard.prototype = new DevCard();

SoldierCard.prototype.use = function(user) {
	if (user == game.me) {
		changeState('place_robber');
	}
	user.soldiers++;
};


/*************************** Victory Point ***************************/
function VPCard(id, name) { DevCard.prototype.construct.call(this, id, name, "Provides one victory point."); }
VPCard.prototype = new DevCard();

// TODO
VPCard.prototype.use = function(user) {
	user.extraPoints ++;
};


/****************** DevCards Initialization Functions ****************/
var devCards = new Array();
var devCardsStatic = new Array(); // for lookup of cid => card objects

devCardsStatic.populate = function() {
	var cnt = 0;

	for (var i = 0 ; i < game.numSoldierCards; i++) {
		this.push(new SoldierCard(cnt++));
	};

	for (var i = 0 ; i < game.numVPCards; i++) {
		this.push(new VPCard(cnt++, game.vpCardNames[i]));
	};

};

devCards.shuffle = function() {
	// clear
	while (this.length > 0) this.pop();

	// copy to devCards
	for (var i = 0 ; i < devCardsStatic.length; i++) {
		this.push(devCardsStatic[i]);
	}

	var n = this.length;
	for (var i = 0 ; i < n*n ; i++) {
		var a = randInt(n);
		var b = randInt(n);

		var t = this[a];
		this[a] = this[b];
		this[b] = t;
	}
};

devCards.load = function( a ) {
	// clear
	while (this.length > 0) this.pop();

	for (var i = 0 ; i < a.length ; i++) {
		this.push( devCardsStatic[a[i]] );
	}
};

devCards.draw = function() {
	return this.pop();
};

