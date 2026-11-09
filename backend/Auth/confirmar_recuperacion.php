<?php
declare(strict_types=1);

require_once __DIR__ . '/recuperacion_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderAuth(405, ['success' => false, 'message' => 'Método no permitido']);
}

$entrada = json_decode(file_get_contents('php://input') ?: '', true);
$correo = strtolower(trim((string) ($entrada['email'] ?? '')));
$codigo = trim((string) ($entrada['codigo'] ?? ''));
$passwordNueva = (string) ($entrada['password_nueva'] ?? '');

if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $codigo) || strlen($passwordNueva) < 8) {
    responderAuth(400, ['success' => false, 'message' => 'Ingresa un correo válido, el código de 6 dígitos y una contraseña nueva de al menos 8 caracteres.']);
}

$claveCuenta = hash('sha256', $correo);
$recuperacion = $_SESSION['recuperacion_password'] ?? null;
if (
    !is_array($recuperacion)
    || !isset($recuperacion['email_hash'], $recuperacion['id_usuario'], $recuperacion['codigo_hash'], $recuperacion['expiracion'], $recuperacion['intentos'])
    || !hash_equals((string) $recuperacion['email_hash'], $claveCuenta)
) {
    responderAuth(400, ['success' => false, 'message' => 'Solicita un nuevo código de recuperación.']);
}

if (time() >= (int) $recuperacion['expiracion']) {
    unset($_SESSION['recuperacion_password']);
    responderAuth(400, ['success' => false, 'message' => 'El código expiró. Solicita uno nuevo.']);
}

if (!hash_equals((string) $recuperacion['codigo_hash'], hash('sha256', session_id() . $codigo))) {
    $_SESSION['recuperacion_password']['intentos']++;
    if ($_SESSION['recuperacion_password']['intentos'] >= 5) {
        unset($_SESSION['recuperacion_password']);
        responderAuth(400, ['success' => false, 'message' => 'Se alcanzó el límite de intentos. Solicita un nuevo código.']);
    }
    responderAuth(400, ['success' => false, 'message' => 'El código ingresado es incorrecto.']);
}

try {
    $cuenta = buscarCuentaRecuperacion($correo);
    if (!$cuenta || (int) $cuenta['id_usuario'] !== (int) $recuperacion['id_usuario']) {
        unset($_SESSION['recuperacion_password']);
        responderAuth(400, ['success' => false, 'message' => 'No se pudo validar la cuenta. Solicita un nuevo código.']);
    }

    $stmt = $pdo->prepare(
        'UPDATE usuarios SET password = :password WHERE id_usuario = :id_usuario'
    );
    $stmt->execute([
        ':password' => password_hash($passwordNueva, PASSWORD_DEFAULT),
        ':id_usuario' => $cuenta['id_usuario']
    ]);
    unset($_SESSION['recuperacion_password']);

    responderAuth(200, ['success' => true, 'message' => 'Contraseña actualizada. Ya puedes iniciar sesión.']);
} catch (PDOException $error) {
    error_log('Error al actualizar contraseña desde recuperación: ' . $error->getMessage());
    responderAuth(500, ['success' => false, 'message' => 'No se pudo actualizar la contraseña. Inténtalo nuevamente.']);
}
