<?php
$cmd = $_POST['cmd'];

if ($cmd == 'clear') { $fp = fopen("xxx.html","w"); }
else { $fp = fopen("xxx.html","a"); }

$msg = $_POST['msg']; fwrite($fp, $msg);
?>
