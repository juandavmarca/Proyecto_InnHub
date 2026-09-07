<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
require_once '../config/database.php';

$idHabitacion = $_GET['id_habitacion'] ?? null;

$sql = 'SELECT * FROM camas';
$params = [];

if ($idHabitacion !== null && $idHabitacion !== '') {
    $sql .= ' WHERE habitaciones_id_habitacion = :id_habitacion';
    $params[':id_habitacion'] = $idHabitacion;
}

$sql .= ' ORDER BY idCamas ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$camas = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($camas);
