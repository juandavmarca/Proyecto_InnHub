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

if (empty($data['nombre'])) {
    echo json_encode([
        'success' => false,
        'message' => 'El nombre es obligatorio',
    ]);
    exit;
}

if (empty($data['descripcion'])) {
    echo json_encode([
        'success' => false,
        'message' => 'La descripción es obligatoria',
    ]);
    exit;
}

try {
    $sql = 'INSERT INTO caracteristicas (nombre, descripcion, habitaciones_id_habitacion) VALUES (:nombre, :descripcion, :habitaciones_id_habitacion)';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombre' => trim($data['nombre']),
        ':descripcion' => trim($data['descripcion']),
        ':habitaciones_id_habitacion' => (int) $data['habitaciones_id_habitacion'],
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Característica registrada correctamente',
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
    ]);
}
