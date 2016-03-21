<?php 
$offset = 60 * 60 * 12;

header("Expires: " . gmdate("D, d M Y H:i:s", time() + $offset) . " GMT");
header("Cache-Control: max-age=$offset, must-revalidate"); 

echo "SOURCE: <a href=\"http://soovle.com/top/\">http://soovle.com/top/</a><br><br>I do not take credit for getting these keywords!<br><br>";
echo file_get_contents('http://soovle.com/top/');
?>