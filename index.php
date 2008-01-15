<?php
include_once("rooms.inc.php");
?>
<html>
 <head>
  <title>Welcome to LonelyIsland!</title>
 </head>
 <body>
  <?php
    $a = get_room_names();
  ?>
  <form action="game.php" method="post">
   <table border="0" cellpadding="0" cellspacing="3">
    <tr><td>Nick:</td><td><input type="text" value="" name="nick"></td>
    <tr>
     <td>Room:</td>
     <td>
      <select name="room">
       <option value="0">[Create new room]</option>
        <?php
         for ($i = 0 ; $i < count($a) ; $i++ )
         {
          echo "<option value=\"{$a[$i]}\">{$a[$i]}'s game</option>";
         }
        ?>
      </select>
     </td>
     <td>
      <input type="submit" name="action" value="Join"><br>
     </td>
    </tr>
   </table>
  </form>

  <p>Due to lack of interest from the developers (at least for now), only Firefox 2+ is supported. Get <a href="http://www.mozilla.org/firefox/">Firefox</a> now! (Sorry .__.)</p>
 </body>
</html>
