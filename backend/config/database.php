<?php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

try {
    cargarEntornoInnHub();
} catch (RuntimeException $error) {
    error_log('No se pudo cargar la configuración privada de InnHub: ' . $error->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'No se pudo leer la configuración del servidor.']);
    exit;
}

$host = trim((string) (getenv('DB_HOST') ?: 'localhost'));
$db = trim((string) (getenv('DB_NAME') ?: ''));
$user = trim((string) (getenv('DB_USER') ?: ''));
$pass = getenv('DB_PASS');

if ($db === '' || $user === '' || $pass === false) {
    error_log('Faltan una o más variables de conexión a la base de datos.');
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'La conexión a la base de datos no está configurada.']);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $error) {
    error_log('Error de conexión a la base de datos. SQLSTATE ' . $error->getCode());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Error de conexión']);
    exit;
}
