<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
require_once '../config/database.php';

if (!empty($_POST)) {
    $data = $_POST;
} else {
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode([
            'success' => false,
            'message' => 'JSON inválido en la solicitud',
        ]);
        exit;
    }
}

if (empty($data['habitaciones_id_habitacion'])) {
    echo json_encode([
        'success' => false,
        'message' => 'La habitación es obligatoria',
    ]);
    exit;
}

$url = null;
if (!empty($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $extension = pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION);
    $filename = uniqid('habitacion_', true) . ($extension ? '.' . $extension : '');
    $targetPath = $uploadDir . $filename;

    if (move_uploaded_file($_FILES['imagen']['tmp_name'], $targetPath)) {
        $url = 'http://localhost/ERPInnHub/backend/uploads/' . $filename;
    }
}

if (empty($url) && !empty($data['url'])) {
    $url = trim($data['url']);
}

if (empty($url)) {
    echo json_encode([
        'success' => false,
        'message' => 'La imagen es obligatoria',
    ]);
    exit;
}

$urlVideo = !empty($data['url_video']) ? trim($data['url_video']) : null;

try {
    $sql = 'INSERT INTO imagenes (url, url_video, habitaciones_id_habitacion) VALUES (:url, :url_video, :habitaciones_id_habitacion)';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':url' => $url,
        ':url_video' => $urlVideo,
        ':habitaciones_id_habitacion' => (int) $data['habitaciones_id_habitacion'],
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Imagen registrada correctamente',
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
    ]);
}
