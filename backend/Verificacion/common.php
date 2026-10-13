<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
$origenesPermitidos = ['http://localhost:5173', 'http://127.0.0.1:5173'];

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

function responder(int $status, array $datos): never
{
    http_response_code($status);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
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
    $archivoEnv = __DIR__ . '/.env';
    if (is_file($archivoEnv)) {
        if (!is_readable($archivoEnv)) {
            error_log('No se puede leer la configuración local de Waupi.');
            responder(500, ['exito' => false, 'mensaje' => 'No se pudo leer la configuración de Waupi.']);
        }

        $lineas = file($archivoEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lineas as $linea) {
            $linea = trim($linea);
            if ($linea === '' || str_starts_with($linea, '#')) {
                continue;
            }

            $partes = explode('=', $linea, 2);
            if (count($partes) !== 2) {
                continue;
            }

            $clave = trim($partes[0]);
            $valor = trim(trim($partes[1]), "\"'");
            if (in_array($clave, ['WUAPI_ACCOUNT_ID', 'WUAPI_API_KEY'], true) && getenv($clave) === false) {
                putenv($clave . '=' . $valor);
            }
        }
    }

    $accountId = trim((string) (getenv('WUAPI_ACCOUNT_ID') ?: ''));
    $apiKey = trim((string) (getenv('WUAPI_API_KEY') ?: ''));

    if ($accountId === '' || $apiKey === '') {
        responder(500, [
            'exito' => false,
            'mensaje' => 'Configura WUAPI_ACCOUNT_ID y WUAPI_API_KEY en backend/Verificacion/.env.'
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
