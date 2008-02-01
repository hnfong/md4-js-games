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
  <form action="poster.php" method="post">
   <table border="0" cellpadding="0" cellspacing="3">
    <tr><td>Nick:</td><td><input type="text" value="" name="nick"></td>
    <tr>
     <td>Room:</td>
     <td>
      <select name="room">
        <option value="-1"> --- </option>
        <?php
         for ($i = 0 ; $i < count($a) ; $i++ )
         {
          echo "<option value=\"{$a[$i]}\">{$a[$i]}'s game</option>";
         }
        ?>
      </select> <input type="submit" name="action" value="Join"><br>
     </td>
    </tr>
    <tr>
     <td colspan="2">
      <br>
      <input type="submit" name="action" value="Create New Room">
     </td>
    </tr>
   </table>
  </form>

  <p>Tested (and supposedly functional) on <a href="http://www.mozilla.org/firefox/">Firefox 2+</a> (Recommended) and IE6. IE5.0 seems to work, but no thorough testing was conducted.</p>
 </body>
</html>
