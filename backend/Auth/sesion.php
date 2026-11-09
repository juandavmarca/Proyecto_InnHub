<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../config/database.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    responderAuth(405, ['success' => false, 'message' => 'Método no permitido']);
}

if (empty($_SESSION['id_usuario'])) {
    responderAuth(401, ['success' => false, 'message' => 'No hay una sesión activa']);
}

try {
    $stmt = $pdo->prepare(
        "SELECT u.id_usuario, u.documento, u.email, u.estado, u.rol,
                e.nombre, e.apellido, e.cargo, e.estado AS estado_empleado,
                e.telefono, e.foto_perifl
         FROM usuarios u
         LEFT JOIN empleados e ON e.documento = u.documento
         WHERE u.id_usuario = :id_usuario
         LIMIT 1"
    );
    $stmt->execute([':id_usuario' => $_SESSION['id_usuario']]);
    $cuenta = $stmt->fetch(PDO::FETCH_ASSOC);
    $rolCuenta = strtolower(trim((string) ($cuenta['rol'] ?? '')));
    $rol = $rolCuenta === 'empleado'
        ? strtolower(trim((string) ($cuenta['cargo'] ?? '')))
        : $rolCuenta;
    $empleadoActivo = $rolCuenta !== 'empleado'
        || strtolower(trim((string) ($cuenta['estado_empleado'] ?? ''))) === 'activo';

    if (
        !$cuenta
        || strtolower(trim((string) $cuenta['estado'])) !== 'activo'
        || !$empleadoActivo
        || !in_array($rol, ['administrador', 'recepcionista'], true)
    ) {
        $_SESSION = [];
        session_destroy();
        responderAuth(401, ['success' => false, 'message' => 'La sesión ya no tiene acceso al panel']);
    }

    responderAuth(200, [
        'success' => true,
        'usuario' => [
            'documento' => $cuenta['documento'],
            'email' => $cuenta['email'],
            'rol' => $rol,
            'nombre' => $cuenta['nombre'] ?? '',
            'apellido' => $cuenta['apellido'] ?? '',
            'cargo' => $cuenta['cargo'] ?? $cuenta['rol'],
            'telefono' => $cuenta['telefono'] ?? '',
            'foto_perfil' => $cuenta['foto_perifl'] ?? ''
        ]
    ]);
} catch (PDOException $error) {
    error_log('Error al verificar sesión: ' . $error->getMessage());
    responderAuth(500, ['success' => false, 'message' => 'No se pudo verificar la sesión']);
}
