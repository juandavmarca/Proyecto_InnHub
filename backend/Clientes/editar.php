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

$idCliente = filter_var($data['id_cliente'] ?? null, FILTER_VALIDATE_INT);
$documento = trim((string) ($data['documento'] ?? ''));
$nombre = trim((string) ($data['nombre'] ?? ''));
$apellido = trim((string) ($data['apellido'] ?? ''));
$tipoDocumento = trim((string) ($data['tipo_documento'] ?? ''));
$telefono = trim((string) ($data['telefono'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$ciudad = trim((string) ($data['ciudad_re'] ?? ''));

if (!$idCliente || $nombre === '' || $apellido === '' || $telefono === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Completa los datos obligatorios del cliente']);
    exit;
}

if ($documento !== '' && !ctype_digit($documento)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El documento debe contener solo números']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email no válido']);
    exit;
}

try {
    $sql = 'UPDATE clientes
            SET documento = :documento, nombre = :nombre, apellido = :apellido,
                tipo_documento = :tipo_documento, telefono = :telefono,
                email = :email, ciudad_re = :ciudad_re
            WHERE id_cliente = :id_cliente';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_cliente' => $idCliente,
        ':documento' => $documento === '' ? null : (int) $documento,
        ':nombre' => $nombre,
        ':apellido' => $apellido,
        ':tipo_documento' => $tipoDocumento === '' ? null : $tipoDocumento,
        ':telefono' => $telefono,
        ':email' => $email,
        ':ciudad_re' => $ciudad === '' ? null : $ciudad
    ]);

    echo json_encode(['success' => true, 'message' => 'Cliente actualizado correctamente'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $error) {
    error_log('No se pudo actualizar el cliente: ' . $error->getCode());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudo actualizar el cliente']);
}
