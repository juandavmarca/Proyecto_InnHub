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

try {
    $sql = 'DELETE FROM camas WHERE idCamas = :idCamas';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':idCamas' => (int) $data['idCamas'],
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Cama eliminada correctamente',
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
    ]);
}
