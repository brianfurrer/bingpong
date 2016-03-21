<?php
// echo file_get_contents('http://ip-api.com/json/' . $_SERVER['REMOTE_ADDR']);

echo "{ \"query\": \"" . $_SERVER['REMOTE_ADDR'] . "\", \"country\": \"United States\"}";
?>