<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header("Content-Type: application/json");
require_once "../config/database.php";

// Obtener JSON enviado desde React
$data = json_decode(file_get_contents("php://input"), true);

// Validaciones backend
if (empty($data['nombre'])) {
    echo json_encode([
        "success" => false,
        "message" => "El nombre es obligatorio"
    ]);
    exit;
}

if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Email no válido"
    ]);
    exit;
}

$sql = "UPDATE clientes SET nombre=:nombre, apellido=:apellido, tipo_documento=:tipo_documento, 
        telefono=:telefono, email=:email, ciudad_re=:ciudad_re 
        WHERE documento=:documento";

$stmt = $pdo->prepare($sql);
$stmt->execute([
    ":documento" => $data['documento'],
    ":nombre" => $data['nombre'],
    ":apellido" => $data['apellido'],
    ":tipo_documento" => $data['tipo_documento'],
    ":telefono" => $data['telefono'],
    ":email" => $data['email'],
    ":ciudad_re" => $data['ciudad_re']
]);

echo json_encode([
    "success" => true,
    "message" => "Cliente actualizado correctamente"
]);
?>
