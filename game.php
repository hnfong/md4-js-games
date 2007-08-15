<?php
 $name = $_POST['nick'];
 $room = $_POST['room'];

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
 if ($room == "0") {
  $room = $name;
  // clear the file
  $fp = fopen("rooms/$room", "w");
  fclose($fp);
 }
?>
<html>
 <head>
  <title>Lonely Island</title>
  <link rel="stylesheet" href="default.css" type="text/css">
  <script type="text/javascript">
   var myName = '<?php echo $name; ?>';
   var myRoom = '<?php echo $room; ?>';
  </script>
  <script type="text/javascript" src="util.js"></script>
  <script type="text/javascript" src="network.js"></script>
  <script type="text/javascript" src="game.js"></script>
  <script type="text/javascript" src="board.js"></script>
  <script type="text/javascript" src="ui.js"></script>
  <script type="text/javascript" src="player.js"></script>
  <script type="text/javascript" src="geom.js"></script>
  <script type="text/javascript" src="devcard.js"></script>
  <script type="text/javascript" src="dialog.js"></script>
 </head>
<body>

<table>
 <tr>
  <td>
   <img src="img/transparent.gif" id="board_interface" style="width:600px; height: 600px; border: 0; position: absolute; left: 0px; top: -120px; z-index: 100" usemap="#cellmap" />
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

<div id="player_window" class="window" style="left: 600px; top: 20px;"></div>
<div id="dice" class="dice" style="left: 700px; top: 300px;" onmousedown="state.diceHandler();"><img src="img/dice1.png"><img src="img/dice6.png"></div>
<div id="steal_window" class="window" style="left: 700px; top: 500px;visibility:hidden;">Steal from:</div>

<div id="purchase_window" class="window" style="left: 770px; top: 20px;"></div>
<div id="res_window" style="left: 770px; top: 250px;"></div>
<input type="button" value="Trade" class="window" style="left: 770px; top: 350px;" onclick="tradeProposeDialog.show();"/>
<input type="button" value="End Turn" class="window" style="left: 820px; top: 350px;" onclick="state.buttonHandler('button_end_turn');"/>
<div id="log_window" class="window" style="left: 770px; top: 380px; width: 200px; height: 100px; overflow: auto;">Welcome to Lonely Island~</div>
<div id="devcard_window" class="window" style="left: 770px; top: 500px;">Development Cards:</div>

<div id="status" class="window" style="left: 300px; top: 500px;">Status: idle</div>
<div style="top: 500px; position: absolute">
<input type="button" value="Join" onclick="join_game();">
<input id="startgamebutton" type="button" value="Start" disabled="disabled" onclick="game.setup()">
<input type="button" value="Clear Data" onclick="clearRemoteLog();">
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
	dialog_init();
	receiveRemoteMessages();
	game.myName = myName;
	sendRemoteMessage("join " + game.myName);
};

</script>

</html>
