<?php

$action = $_POST['action'];
$nick = $_POST['nick'];
$room = $_POST['room'];
if ($action != "Join") {
	$room = $nick;
	// clear the file
	$fp = fopen("rooms/$room", "w");
	fclose($fp);
}

header("location: game.php?room=$room&nick=$nick&rnd=" . rand());
exit;

?>
