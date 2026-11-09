<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../config/database.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderAuth(405, ['success' => false, 'message' => 'Método no permitido']);
}

if (empty($_SESSION['id_usuario'])) {
    responderAuth(401, ['success' => false, 'message' => 'Inicia sesión para cambiar tu contraseña']);
}

$entrada = json_decode(file_get_contents('php://input') ?: '', true);
$passwordActual = (string) ($entrada['password_actual'] ?? '');
$passwordNueva = (string) ($entrada['password_nueva'] ?? '');

if ($passwordActual === '' || $passwordNueva === '') {
    responderAuth(400, ['success' => false, 'message' => 'Completa tu contraseña actual y la nueva']);
}

if (strlen($passwordNueva) < 8) {
    responderAuth(400, ['success' => false, 'message' => 'La nueva contraseña debe tener al menos 8 caracteres']);
}

try {
    $stmt = $pdo->prepare(
        "SELECT password, estado, rol
         FROM usuarios
         WHERE id_usuario = :id_usuario
         LIMIT 1"
    );
    $stmt->execute([':id_usuario' => $_SESSION['id_usuario']]);
    $cuenta = $stmt->fetch(PDO::FETCH_ASSOC);

    if (
        !$cuenta
        || strtolower(trim((string) $cuenta['estado'])) !== 'activo'
        || !in_array(strtolower(trim((string) $cuenta['rol'])), ['administrador', 'recepcionista'], true)
    ) {
        $_SESSION = [];
        session_destroy();
        responderAuth(401, ['success' => false, 'message' => 'La sesión ya no tiene acceso al panel']);
    }

    if (!password_verify($passwordActual, $cuenta['password'])) {
        responderAuth(400, ['success' => false, 'message' => 'La contraseña actual no es correcta']);
    }

    if (password_verify($passwordNueva, $cuenta['password'])) {
        responderAuth(400, ['success' => false, 'message' => 'La nueva contraseña debe ser diferente a la actual']);
    }

    $stmt = $pdo->prepare("UPDATE usuarios SET password = :password WHERE id_usuario = :id_usuario");
    $stmt->execute([
        ':password' => password_hash($passwordNueva, PASSWORD_DEFAULT),
        ':id_usuario' => $_SESSION['id_usuario']
    ]);

    responderAuth(200, ['success' => true, 'message' => 'Contraseña actualizada correctamente']);
} catch (PDOException $error) {
    error_log('Error al cambiar contraseña: ' . $error->getMessage());
    responderAuth(500, ['success' => false, 'message' => 'No se pudo actualizar la contraseña']);
}
