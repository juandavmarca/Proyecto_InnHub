<?php

header("Content-Type: application/json");
 header('Access-Control-Allow-Origin: *');
 header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
 header('Access-Control-Allow-Headers: Content-Type, Authorization');  
 require_once "../config/database.php";

 $stmt = $pdo->query("SELECT * FROM empleados ORDER BY documento ");
 $empleados = $stmt->fetchAll(PDO::FETCH_ASSOC);

 echo json_encode($empleados);