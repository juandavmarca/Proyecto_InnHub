<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
require_once "../config/database.php";

// Obtener datos enviados desde React
if (!empty($_POST)) {
    $data = $_POST;
} else {
    $data = json_decode(file_get_contents("php://input"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode([
            "success" => false,
            "message" => "JSON inválido en la solicitud"
        ]);
        exit;
    }
}

// Validaciones backend
if (empty($data['documento']) || empty($data['nombre'])) {
    echo json_encode([
        "success" => false,
        "message" => "El documento y el nombre son obligatorios"
    ]);
    exit;
}

if (!in_array($data['cargo'] ?? '', ['Administrador', 'Recepcionista'], true)) {
    echo json_encode([
        "success" => false,
        "message" => "Selecciona un cargo válido: Administrador o Recepcionista"
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

$fotoPerfilUrl = null;
if (!empty($_FILES['foto_perifl']) && $_FILES['foto_perifl']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $extension = pathinfo($_FILES['foto_perifl']['name'], PATHINFO_EXTENSION);
    $filename = uniqid('empleado_', true) . ($extension ? ".{$extension}" : "");
    $targetPath = $uploadDir . $filename;

    if (move_uploaded_file($_FILES['foto_perifl']['tmp_name'], $targetPath)) {
        $fotoPerfilUrl = "http://localhost/ERPInnHub/backend/uploads/{$filename}";
    }
}

try {
    $pdo->beginTransaction();

    $sql = "INSERT INTO empleados (documento,nombre,apellido,cargo,telefono,email,foto_perifl)
            VALUES (:documento,:nombre,:apellido,:cargo,:telefono,:email,:foto_perifl)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":documento" => $data['documento'],
        ":nombre" => $data['nombre'],
        ":apellido" => $data['apellido'] ?? "",
        ":cargo" => $data['cargo'] ?? "",
        ":telefono" => $data['telefono'] ?? "",
        ":email" => $data['email'] ?? "",
        ":foto_perifl" => $fotoPerfilUrl
    ]);

    $sqlUsuario = "INSERT INTO usuarios (documento,email,password,estado,rol,fecha_registro)
                   VALUES (:documento,:email,:password,'Activo',:rol,NOW())";
    $stmtUsuario = $pdo->prepare($sqlUsuario);
    $stmtUsuario->execute([
        ":documento" => $data['documento'],
        ":email" => $data['email'] ?? "",
        ":password" => password_hash((string) $data['documento'], PASSWORD_DEFAULT),
        ":rol" => strtolower($data['cargo'])
    ]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Empleado y usuario creados correctamente"
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        "success" => false,
        "message" => "Error de base de datos: " . $e->getMessage()
    ]);
} 