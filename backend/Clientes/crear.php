<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON inválido en la solicitud']);
    exit;
}

$nombre = trim((string) ($data['nombre'] ?? ''));
$apellido = trim((string) ($data['apellido'] ?? ''));
$documento = trim((string) ($data['documento'] ?? ''));
$tipoDocumento = trim((string) ($data['tipo_documento'] ?? ''));
$telefono = trim((string) ($data['telefono'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$ciudad = trim((string) ($data['ciudad_re'] ?? ''));

if ($nombre === '' || $apellido === '' || $telefono === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nombre, apellido, teléfono y correo son obligatorios']);
    exit;
}

if (strlen($nombre) > 100 || strlen($apellido) > 100 || strlen($email) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Revisa los nombres y el formato del correo electrónico']);
    exit;
}

if ($documento !== '' && !ctype_digit($documento)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El documento debe contener solo números']);
    exit;
}

try {
    $sql = 'INSERT INTO clientes (documento, nombre, apellido, tipo_documento, telefono, email, ciudad_re)
            VALUES (:documento, :nombre, :apellido, :tipo_documento, :telefono, :email, :ciudad_re)';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':documento' => $documento === '' ? null : (int) $documento,
        ':nombre' => $nombre,
        ':apellido' => $apellido,
        ':tipo_documento' => $tipoDocumento === '' ? null : $tipoDocumento,
        ':telefono' => $telefono,
        ':email' => $email,
        ':ciudad_re' => $ciudad === '' ? null : $ciudad
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Cliente creado correctamente',
        'id_cliente' => (int) $pdo->lastInsertId()
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $error) {
    error_log('No se pudo crear un cliente: ' . $error->getCode());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudo guardar el cliente']);
}
