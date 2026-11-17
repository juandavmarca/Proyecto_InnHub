<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function responder(int $status, array $datos): never
{
    http_response_code($status);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

require_once __DIR__ . '/../config/env.php';
try {
    cargarEntornoInnHub();
} catch (RuntimeException $error) {
    error_log('No se pudo cargar la configuración privada de InnHub: ' . $error->getMessage());
    responder(500, ['exito' => false, 'mensaje' => 'No se pudo leer la configuración del servidor.']);
}

$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
$origenesPermitidos = ['http://localhost:5173', 'http://127.0.0.1:5173'];
$origenConfigurado = rtrim(trim((string) (getenv('APP_FRONTEND_ORIGIN') ?: '')), '/');
if ($origenConfigurado !== '' && !in_array($origenConfigurado, $origenesPermitidos, true)) {
    $origenesPermitidos[] = $origenConfigurado;
}

if ($origen !== '' && !in_array($origen, $origenesPermitidos, true)) {
    http_response_code(403);
    echo json_encode(['exito' => false, 'mensaje' => 'Origen no permitido'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($origen !== '') {
    header('Access-Control-Allow-Origin: ' . $origen);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function leerEntrada(): array
{
    $contenido = file_get_contents('php://input');
    $entrada = json_decode($contenido === false ? '' : $contenido, true);

    if (!is_array($entrada)) {
        responder(400, ['exito' => false, 'mensaje' => 'La solicitud no contiene datos JSON válidos.']);
    }

    return $entrada;
}

function cargarConfiguracionWuapi(): array
{
    $accountId = trim((string) (getenv('WUAPI_ACCOUNT_ID') ?: ''));
    $apiKey = trim((string) (getenv('WUAPI_API_KEY') ?: ''));

    if ($accountId === '' || $apiKey === '') {
        responder(500, [
            'exito' => false,
            'mensaje' => 'Configura WUAPI_ACCOUNT_ID y WUAPI_API_KEY en el archivo privado de InnHub.'
        ]);
    }

    return [$accountId, $apiKey];
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}
