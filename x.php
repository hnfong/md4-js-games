<?php

$room = $_POST['room']; // FIXME: checking

$cmd = $_POST['cmd'];
$target_file = "rooms/$room";

if ($cmd == 'clear') { $fp = fopen($target_file,"w"); }
else { $fp = fopen($target_file,"a"); }
$msg = $_POST['msg']; fwrite($fp, $msg);
?>
