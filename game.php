<?php
 $name = $_GET['nick'];
 $room = $_GET['room'];

 if (!preg_match('/^[a-zA-Z0-9]+$/', $name))
 {
  echo "invalid name";
  exit;
 }
 if (!preg_match('/^[a-zA-Z0-9]+$/', $room))
 {
  echo "invalid room";
  exit;
 }
  $fp = fopen("rooms/$room", "a");
  fwrite($fp, "-1 -1 join " . $name . "\n");
  fclose($fp);
?>
<html>
 <head>
  <title>Lonely Island</title>
  <link rel="stylesheet" href="default.css" type="text/css">
  <script type="text/javascript">
   var myName = '<?php echo $name; ?>';
   var myRoom = '<?php echo $room; ?>';
  </script>
  <script type="text/javascript" src="protocrap.js"></script>
  <script type="text/javascript" src="util.js"></script>
  <script type="text/javascript" src="network.js"></script>
  <script type="text/javascript" src="game.js"></script>
  <script type="text/javascript" src="board.js"></script>
  <script type="text/javascript" src="ui.js"></script>
  <script type="text/javascript" src="player.js"></script>
  <script type="text/javascript" src="geom.js"></script>
  <script type="text/javascript" src="devcard.js"></script>
  <script type="text/javascript" src="dialog.js"></script>
  <script type="text/javascript" src="trade.js"></script>
 </head>
<body>

<table>
 <tr>
  <td>
   <img src="img/transparent.gif" onmousedown="return false;" id="board_interface" style="width:500px; height: 600px; border: 0; position: absolute; left: 0px; top: -120px; z-index: 100" usemap="#cellmap" />
  </td>
 </tr>
</table>

<map name="cellmap" id="cellmap"></map>
<map name="vertexmap" id="vertexmap"></map>
<map name="edgemap" id="edgemap"></map>

<div id="tiles"></div>
<div id="markers"></div>
<div id="ports"></div>
<div id="roads"></div>
<div id="buildings"></div>
<div id="robber" style="position:absolute;visibility:hidden;"><img src="img/robber.gif"/></div>

<div id="player_window" style="position: absolute; left: 850px; top: 20px; width: 170px"></div>
<div id="dice" class="dice" style="width: 52px; left: 600px; top: 230px;" onmousedown="state.diceHandler();"><img src="img/dice1.png"><img src="img/dice6.png"></div>

<div id="purchase_window" class="window" style="width: 340px; left: 500px; top: 20px; padding: 5px 3px; visibility: hidden; ">
	Development Card (<span id="id_remain_devcard"></span> left) <span id="id_cost_devcard"></span><input type="button" id="button_buy_devcard" value="Buy" class="buybutton" onclick="state.buttonHandler('button_buy_devcard');return false;"/><hr/>
	City (<span id="id_remain_city"></span> left) <span id="id_cost_city"></span><input type="button" id="button_buy_city" value="Buy" class="buybutton" onclick="state.buttonHandler('button_buy_city');return false;"/><hr/>
	Settlement (<span id="id_remain_sett"></span> left) <span id="id_cost_sett"></span><input type="button" id="button_buy_sett" value="Buy" class="buybutton" onclick="state.buttonHandler('button_buy_sett');return false;"/><hr/>
	Road (<span id="id_remain_road"></span> left) <span id="id_cost_road"></span><input type="button" id="button_buy_road" value="Buy" class="buybutton" onclick="state.buttonHandler('button_buy_road');return false;"/>
</div>
<div id="res_window" class="window" style="left: 500px; top: 170px; visibility: hidden;"></div>
<input type="button" id="id_button_trade" value="Trade" class="button" style="left: 600px; top: 200px;" onclick="state.buttonHandler('button_trade');"/>
<input type="button" id="id_button_endturn" value="End Turn" class="button" style="left: 660px; top: 200px;" onclick="state.buttonHandler('button_end_turn');"/>
<div id="log_window" class="window" style="left: 500px; top: 280px; width: 325px; height: 160px; overflow: auto;">Welcome to Lonely Island~</div>
<div id="devcard_window" class="window" style="left: 500px; top: 460px; width: 140px;">Development Cards:</div>
<div id="steal_window" class="window" style="left: 670px; top: 460px; visibility: hidden;">Steal from:</div>

<div id="status" class="statuswindow" style="width: 200px; left: 600px; top: 170px;">Status: idle</div>
<div style="top: 500px; position: absolute">
<input id="startgamebutton" type="button" value="Start" disabled="disabled" onclick="game.setup()">
</div>

<div id="dialogs"></div>

</body>

<script language="javascript" src="state.js"></script>
<script language="javascript" src="remote.js"></script>

<script language="javascript">

//////////////////////////////////////////////////////// BEGIN CONFIG AND CONSTANTS

var game = new Game(myRoom);
var board = new Board();

var preGamePlayerNames = new Array();

var initRolls;
var tiedPlayers;
var firstPlayer;
var initialSett;

function cat_initRoll(pid) {
	var a = roll();
	var txt = '';
	var outcome = 0;
	for (var i = 0; i < game.numDice; ++i) {
		txt += a[i] + ' ';
		outcome += a[i];
	}
	initRolls[pid] = outcome;
	// determine next roller
	var index = 0;
	for (var i = 0; i < tiedPlayers.length; ++i)
		if (tiedPlayers[i] == pid)
			index = i;
	if (index < tiedPlayers.length - 1)
		return tiedPlayers[index+1];
	return -1;
}

function cat_initRollFinishRound() {
	var highest = 0;
	for (var i = 0; i < tiedPlayers.length; ++i)
		if (initRolls[tiedPlayers[i]] > highest)
			highest = initRolls[tiedPlayers[i]];
	var newTiedPlayers = new Array();
	for (var i = 0; i < tiedPlayers.length; ++i)
		if (initRolls[tiedPlayers[i]] == highest)
			newTiedPlayers.push(tiedPlayers[i]);
	tiedPlayers = newTiedPlayers;
	if (tiedPlayers.length == 1)
		return firstPlayer = tiedPlayers[0];
	else
		return -1;
}


window.onload = function() {
	devCardsStatic.populate();
	function dumpCost(a) {
		var s = '';
		for (var i = 0; i < game.numResourceTypes; ++i)
			if (a[i] > 0)
				s += '<img src="img/'+game.resourceNames[i]+'_small.gif">' + ' x' + a[i] + '&nbsp;';
		return s;
	}
	g('id_cost_devcard').innerHTML = dumpCost(game.cardCost);
	g('id_cost_city').innerHTML = dumpCost(game.cityCost);
	g('id_cost_sett').innerHTML = dumpCost(game.settCost);
	g('id_cost_road').innerHTML = dumpCost(game.roadCost);
	g('id_button_endturn').disabled = true;
	g('id_button_trade').disabled = true;
	dialog_init();
	game.started = false;
	game.myId = -1;
	game.myName = myName;
	receiveRemoteMessages();
};

</script>

</html>
