<?php
declare(strict_types=1);

require_once __DIR__ . '/../Auth/common.php';
require_once __DIR__ . '/../config/database.php';

header('Cache-Control: no-store');

function responderReservas(int $status, array $datos): never
{
    http_response_code($status);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function autorizarRecepcion(): array
{
    global $pdo;

    $idUsuario = (int) ($_SESSION['id_usuario'] ?? 0);
    if ($idUsuario < 1) {
        responderReservas(401, ['exito' => false, 'mensaje' => 'Inicia sesión para gestionar reservas.']);
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT u.documento, u.rol, u.estado,
                    e.id_empleado, e.cargo AS cargo_empleado, e.estado AS estado_empleado
             FROM usuarios u
             LEFT JOIN empleados e ON e.documento = u.documento
             WHERE u.id_usuario = :id_usuario
             LIMIT 1'
        );
        $stmt->execute([':id_usuario' => $idUsuario]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $error) {
        error_log('No se pudo validar el acceso a reservas: ' . $error->getMessage());
        responderReservas(500, ['exito' => false, 'mensaje' => 'No se pudo validar el acceso.']);
    }

    $rolCuenta = strtolower(trim((string) ($usuario['rol'] ?? '')));
    $rol = $rolCuenta === 'empleado'
        ? strtolower(trim((string) ($usuario['cargo_empleado'] ?? '')))
        : $rolCuenta;
    $empleadoActivo = $rolCuenta !== 'empleado'
        || strtolower(trim((string) ($usuario['estado_empleado'] ?? ''))) === 'activo';

    if (
        !$usuario
        || strtolower(trim((string) $usuario['estado'])) !== 'activo'
        || !$empleadoActivo
        || !in_array($rol, ['administrador', 'recepcionista'], true)
    ) {
        responderReservas(403, ['exito' => false, 'mensaje' => 'No tienes permiso para gestionar reservas.']);
    }

    return [
        'id_empleado' => isset($usuario['id_empleado']) ? (int) $usuario['id_empleado'] : null,
        'rol' => $rol,
    ];
}

function esReservaPendienteDeConfirmacion(string $estado): bool
{
    $estadoNormalizado = strtolower(trim($estado));
    return in_array($estadoNormalizado, ['pendiente de confirmación', 'pago aprobado'], true);
}
