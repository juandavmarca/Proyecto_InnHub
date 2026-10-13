<?php
require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$entrada = leerEntrada();
$telefono = trim((string) ($entrada['telefono'] ?? ''));
$cliente = $entrada['cliente'] ?? null;
if (!preg_match('/^\+[1-9]\d{7,14}$/', $telefono)) {
    responder(400, [
        'exito' => false,
        'mensaje' => 'Ingresa el teléfono con código de país, por ejemplo +573001234567.'
    ]);
}

$nombre = trim((string) (is_array($cliente) ? ($cliente['firstName'] ?? '') : ''));
$apellido = trim((string) (is_array($cliente) ? ($cliente['lastName'] ?? '') : ''));
$email = trim((string) (is_array($cliente) ? ($cliente['email'] ?? '') : ''));
if (
    $nombre === '' || strlen($nombre) > 100
    || $apellido === '' || strlen($apellido) > 100
    || strlen($email) > 100
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
    responder(400, ['exito' => false, 'mensaje' => 'Ingresa nombres, apellidos y un correo electrónico válido.']);
}

$clientePendiente = [
    'nombre' => $nombre,
    'apellido' => $apellido,
    'email' => $email
];

$claveTelefono = hash('sha256', $telefono);
$claveOtp = 'otp_' . $claveTelefono;
$ultimoEnvio = (int) ($_SESSION['otp_ultimo_envio'][$claveTelefono] ?? 0);
$segundosRestantes = 60 - (time() - $ultimoEnvio);
if ($ultimoEnvio > 0 && $segundosRestantes > 0) {
    responder(429, [
        'exito' => false,
        'mensaje' => "Espera {$segundosRestantes} segundos antes de solicitar otro código."
    ]);
}

[$accountId, $apiKey] = cargarConfiguracionWuapi();
if (!function_exists('curl_init')) {
    error_log('La extensión cURL no está habilitada en PHP.');
    responder(500, ['exito' => false, 'mensaje' => 'El servidor no tiene habilitada la extensión cURL.']);
}

$codigo = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
$payload = [
    'accountId' => $accountId,
    'to' => $telefono,
    'type' => 'text',
    'text' => "Hola {$nombre} {$apellido}, ¡bienvenido a InnHub! Tu código para reservar en el Hotel Valencia es: {$codigo}. Válido por 3 minutos."
];

$ch = curl_init('https://api.wuapi.dev/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
        'Idempotency-Key: ' . bin2hex(random_bytes(16))
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE)
]);

$respuesta = curl_exec($ch);
$errorCurl = curl_error($ch);
$codigoHttp = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($respuesta === false || $codigoHttp < 200 || $codigoHttp >= 300) {
    if ($respuesta === false) {
        error_log('Error de conexión con Waupi: ' . $errorCurl);
        responder(502, [
            'exito' => false,
            'mensaje' => 'No se pudo conectar con Waupi. Comprueba la conexión del servidor e inténtalo de nuevo.'
        ]);
    }

    $respuestaApi = json_decode((string) $respuesta, true);
    $codigoApi = is_array($respuestaApi) && isset($respuestaApi['code'])
        ? preg_replace('/[^a-zA-Z0-9_.-]/', '', (string) $respuestaApi['code'])
        : '';

    switch ($codigoHttp) {
        case 400:
        case 422:
            $mensajeError = 'Waupi rechazó los datos del mensaje. Revisa el número con código de país y la cuenta configurada.';
            break;
        case 401:
        case 403:
            $mensajeError = 'Waupi rechazó la API key o no tiene permiso para enviar. Comprueba la clave vigente y sus permisos.';
            break;
        case 404:
            $mensajeError = 'Waupi no encuentra la cuenta de WhatsApp indicada. Verifica que WUAPI_ACCOUNT_ID sea el ID de la cuenta conectada y que su estado sea ready.';
            break;
        case 429:
            $mensajeError = 'Waupi limitó los envíos. Espera un momento antes de volver a intentarlo.';
            break;
        default:
            $mensajeError = 'Waupi no pudo procesar el envío. Inténtalo de nuevo más tarde.';
            break;
    }

    error_log('Waupi rechazó el envío del código. HTTP ' . $codigoHttp
        . ($codigoApi !== '' ? ', código ' . substr($codigoApi, 0, 80) : ''));
    responder(502, [
        'exito' => false,
        'mensaje' => $mensajeError
    ]);
}

$expiracion = time() + 180;
$_SESSION[$claveOtp] = [
    'codigo' => $codigo,
    'expiracion' => $expiracion,
    'intentos' => 0,
    'cliente' => $clientePendiente
];
$_SESSION['otp_ultimo_envio'][$claveTelefono] = time();

responder(200, [
    'exito' => true,
    'mensaje' => 'Código enviado por WhatsApp.',
    'expiresAt' => gmdate('c', $expiracion)
]);
