<?php
declare(strict_types=1);

require_once __DIR__ . '/recuperacion_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderAuth(405, ['success' => false, 'message' => 'Método no permitido']);
}

$entrada = json_decode(file_get_contents('php://input') ?: '', true);
$correo = strtolower(trim((string) ($entrada['email'] ?? '')));
if ($correo === '' || strlen($correo) > 100 || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responderAuth(400, ['success' => false, 'message' => 'Ingresa un correo electrónico válido.']);
}

$claveCuenta = hash('sha256', $correo);
$ultimoEnvio = (int) ($_SESSION['recuperacion_ultimo_envio'][$claveCuenta] ?? 0);
$segundosRestantes = 60 - (time() - $ultimoEnvio);
if ($ultimoEnvio > 0 && $segundosRestantes > 0) {
    responderAuth(429, ['success' => false, 'message' => "Espera {$segundosRestantes} segundos antes de solicitar otro código."]);
}

try {
    $cuenta = buscarCuentaRecuperacion($correo);
    unset($_SESSION['recuperacion_password']);
    if ($cuenta && filter_var($cuenta['correo_recuperacion'], FILTER_VALIDATE_EMAIL)) {
        $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        if (enviarCodigoRecuperacionCorreo($cuenta['correo_recuperacion'], $codigo)) {
            $_SESSION['recuperacion_password'] = [
                'email_hash' => $claveCuenta,
                'id_usuario' => (int) $cuenta['id_usuario'],
                'codigo_hash' => hash('sha256', session_id() . $codigo),
                'expiracion' => time() + 300,
                'intentos' => 0
            ];
        }
    }

    $_SESSION['recuperacion_ultimo_envio'][$claveCuenta] = time();
    responderAuth(200, [
        'success' => true,
        'message' => 'Si el correo corresponde a una cuenta activa, enviaremos un código a esa dirección.'
    ]);
} catch (PDOException $error) {
    error_log('Error al buscar cuenta para recuperar contraseña: ' . $error->getMessage());
    responderAuth(500, ['success' => false, 'message' => 'No se pudo procesar la solicitud. Inténtalo nuevamente.']);
}
