<?php

 $host = "localhost";
 $db = "u586922323_innhub";
 $user = "u586922323_innhub";
 $pass = "InnHub-2026S";

 try {
 $pdo = new PDO(
 "mysql:host=$host;dbname=$db;charset=utf8",
 $user,
 $pass
 );
 $pdo->setAttribute(PDO::ATTR_ERRMODE,
PDO::ERRMODE_EXCEPTION);
 } catch (PDOException $e) {
 echo json_encode([
 "error" => "Error de conexión"
 ]);
 exit;
 }
 ?>