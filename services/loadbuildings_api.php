<?php

require_once ('/var/www/esns/phplibs/db.php');

$schoolID = $_GET["schoolID"];


$data = new ESNSData();
$data->SetReturnType("json");
$result = $data->LoadBuildings($schoolID);

header('Content-Type: application/json');
echo $result;


