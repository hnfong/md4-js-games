// abstract,base class
function DevCard(id, name, description, usable) { this.construct(id, name, description, usable); }

DevCard.prototype.construct = function(id,name,description)
{
	DevCard.construct(this,id,name,description);
};

/* this is a "static" function to workaround js's problem of not calling super() */
DevCard.construct = function(obj,id,name,description) {
	obj.id = id;
	obj.name = name;
	obj.description = description;
	obj.just_bought = true;
};

/*************************** Soldier ***************************/
function SoldierCard(id) { DevCard.construct(this, id, "Soldier", "Move the robber to another hex and steal one resource from an adjacent player."); }
SoldierCard.prototype = new DevCard();

SoldierCard.prototype.type = 'soldier';

SoldierCard.prototype.use = function(user) {
	if (user == game.me) {
		changeState('place_robber');
	}
	user.soldiers++;
	game.usedCard = 1;
	game.updateLargestArmy();
};


/*************************** Victory Point ***************************/
function VPCard(id, name) { DevCard.construct(this, id, name, "Provides one victory point. You may play this card at any time during your turn."); }
VPCard.prototype = new DevCard();

VPCard.prototype.type = 'vp';

VPCard.prototype.use = function(user) {
	user.vpcard();
};


/******************************* Plenty *******************************/
function PlentyCard(id) { DevCard.construct(this, id, 'Year of Plenty', "Obtain two free resources of any type(s)."); }
PlentyCard.prototype = new DevCard();

PlentyCard.prototype.type = 'plenty';

PlentyCard.prototype.use = function(user) {
	if (user == game.me) {
		plentyDialog.show();
	}
	game.usedCard = 1;
};


/******************************* Monopoly *******************************/
function MonopolyCard(id) { DevCard.construct(this, id, 'Monopoly', "Monopolize any one type of resource by compelling other players to turn over all their resources of that type."); }
MonopolyCard.prototype = new DevCard();

MonopolyCard.prototype.type = 'monopoly';

MonopolyCard.prototype.use = function(user) {
	if (user == game.me) {
		monopolyDialog.show();
	}
	game.usedCard = 1;
};


/******************************* Road *******************************/
function RoadCard(id) { DevCard.construct(this, id, 'Build Two Roads', "Build two roads for free."); }
RoadCard.prototype = new DevCard();

RoadCard.prototype.type = 'road';

RoadCard.prototype.use = function(user) {
	if (user == game.me) {
		changeState('build_two_free_roads');
	}
	game.usedCard = 1;
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

	for (var i = 0 ; i < game.numPlentyCards; i++) {
		this.push(new PlentyCard(cnt++));
	};

	for (var i = 0 ; i < game.numMonopolyCards; i++) {
		this.push(new MonopolyCard(cnt++));
	};

	for (var i = 0 ; i < game.numRoadCards; i++) {
		this.push(new RoadCard(cnt++));
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

