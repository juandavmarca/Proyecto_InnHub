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

if (empty($data['idCamas'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Falta el identificador de la cama',
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

try {
    $sql = 'UPDATE camas SET tipo = :tipo, tamano = :tamano, cantidad = :cantidad WHERE idCamas = :idCamas';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':tipo' => $data['tipo'],
        ':tamano' => $data['tamano'],
        ':cantidad' => (int) $data['cantidad'],
        ':idCamas' => (int) $data['idCamas'],
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Cama actualizada correctamente',
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
    ]);
}
