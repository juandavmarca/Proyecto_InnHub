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

// Obtener foto actual para mantenerla si no se carga una nueva
$sqlSelect = "SELECT foto_perifl FROM empleados WHERE documento=:documento";
$stmtSelect = $pdo->prepare($sqlSelect);
$stmtSelect->execute([":documento" => $data['documento']]);
$empleado = $stmtSelect->fetch(PDO::FETCH_ASSOC);
$fotoPerfilUrl = $empleado['foto_perifl'] ?? null;

// Si se carga una nueva foto
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
    $sql = "UPDATE empleados SET nombre=:nombre, apellido=:apellido, cargo=:cargo, 
            telefono=:telefono, email=:email, foto_perifl=:foto_perifl 
            WHERE documento=:documento";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":documento" => $data['documento'],
        ":nombre" => $data['nombre'],
        ":apellido" => $data['apellido'],
        ":cargo" => $data['cargo'],
        ":telefono" => $data['telefono'],
        ":email" => $data['email'],
        ":foto_perifl" => $fotoPerfilUrl
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Empleado actualizado correctamente"
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error de base de datos: " . $e->getMessage()
    ]);
}
?>
