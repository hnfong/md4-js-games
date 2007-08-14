<?php
function get_room_names()
{
 $base = "rooms";
 $d = opendir($base);
 $ret = array();
 while ($l = readdir($d)) {
  if (substr($l,0,1) == '.') continue;
  $f = $base . "/" . $l;
  if (is_file($f))
  {
   array_push($ret, $l);
  }

 }
 return $ret;
}
?>
