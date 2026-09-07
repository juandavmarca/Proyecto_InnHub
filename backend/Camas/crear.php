<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
require_once '../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'success' => false,
        'message' => 'JSON inválido en la solicitud',
    ]);
    exit;
}

if (empty($data['habitaciones_id_habitacion'])) {
    echo json_encode([
        'success' => false,
        'message' => 'La habitación es obligatoria',
    ]);
    exit;
}

if (empty($data['tipo'])) {
    echo json_encode([
        'success' => false,
        'message' => 'El tipo de cama es obligatorio',
    ]);
    exit;
}

if (empty($data['tamano'])) {
    echo json_encode([
        'success' => false,
        'message' => 'El tamaño de la cama es obligatorio',
    ]);
    exit;
}

if (!isset($data['cantidad']) || $data['cantidad'] === '') {
    echo json_encode([
        'success' => false,
        'message' => 'La cantidad es obligatoria',
    ]);
    exit;
}

try {
    $sql = 'INSERT INTO camas (tipo, tamano, cantidad, habitaciones_id_habitacion) VALUES (:tipo, :tamano, :cantidad, :habitaciones_id_habitacion)';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':tipo' => $data['tipo'],
        ':tamano' => $data['tamano'],
        ':cantidad' => (int) $data['cantidad'],
        ':habitaciones_id_habitacion' => (int) $data['habitaciones_id_habitacion'],
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Cama registrada correctamente',
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
    ]);
}
