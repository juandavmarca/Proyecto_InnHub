<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
require_once "../config/database.php";

// Obtener JSON enviado desde React
$data = json_decode(file_get_contents("php://input"), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        "success" => false,
        "message" => "JSON inválido en la solicitud"
    ]);
    exit;
}

// Validaciones backend
if (empty($data['numero'])) {
    echo json_encode([
        "success" => false,
        "message" => "El número es obligatorio"
    ]);
    exit;
}

try {
    $sql = "INSERT INTO habitaciones (numero,tipo,precio_noche,estado) 
            VALUES (:numero,:tipo,:precio_noche,:estado)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":numero" => $data['numero'],
        ":tipo" => $data['tipo'],
        ":precio_noche" => $data['precio_noche'],
        ":estado" => $data['estado']
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Habitación creada correctamente"
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error de base de datos: " . $e->getMessage()
    ]);
}