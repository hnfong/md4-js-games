<?php
$room = $_POST['room']; // FIXME: checking
$fp = fopen("rooms/$room","a"); 
fwrite($fp, $_POST['msg']);
fclose($fp);
?>
