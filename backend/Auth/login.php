<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../config/database.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderAuth(405, ['success' => false, 'message' => 'Método no permitido']);
}

$entrada = json_decode(file_get_contents('php://input') ?: '', true);
$usuarioIngresado = trim((string) ($entrada['usuario'] ?? ''));
$password = (string) ($entrada['password'] ?? '');

if ($usuarioIngresado === '' || $password === '') {
    responderAuth(400, ['success' => false, 'message' => 'Ingresa tu usuario y contraseña']);
}

try {
    $sql = "SELECT DISTINCT u.id_usuario, u.documento, u.email, u.password, u.estado, u.rol,
                   e.cargo AS cargo_empleado, e.estado AS estado_empleado
            FROM usuarios u
            LEFT JOIN empleados e ON e.documento = u.documento
            WHERE u.documento = :documento
               OR u.email = :email
               OR e.email = :email_empleado
            ORDER BY CASE WHEN u.documento = :documento_prioridad THEN 0 ELSE 1 END";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':documento' => $usuarioIngresado,
        ':email' => $usuarioIngresado,
        ':email_empleado' => $usuarioIngresado,
        ':documento_prioridad' => $usuarioIngresado
    ]);
    $cuentas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $cuenta = null;

    foreach ($cuentas as $cuentaEncontrada) {
        $rolCuenta = strtolower(trim((string) $cuentaEncontrada['rol']));
        $rol = $rolCuenta === 'empleado'
            ? strtolower(trim((string) ($cuentaEncontrada['cargo_empleado'] ?? '')))
            : $rolCuenta;
        $estado = strtolower(trim((string) $cuentaEncontrada['estado']));
        $rolPermitido = in_array($rol, ['administrador', 'recepcionista'], true);
        $empleadoActivo = $rolCuenta !== 'empleado'
            || strtolower(trim((string) ($cuentaEncontrada['estado_empleado'] ?? ''))) === 'activo';

        if (
            $rolPermitido
            && $empleadoActivo
            && $estado === 'activo'
            && password_verify($password, $cuentaEncontrada['password'])
        ) {
            $cuenta = $cuentaEncontrada;
            $cuenta['rol'] = $rol;
            break;
        }
    }

    if (!$cuenta && count($cuentas) === 0) {
        $stmtEmpleado = $pdo->prepare(
            "SELECT documento, email, cargo, estado
             FROM empleados
             WHERE documento = :documento OR email = :email
             ORDER BY CASE WHEN documento = :documento_prioridad THEN 0 ELSE 1 END
             LIMIT 1"
        );
        $stmtEmpleado->execute([
            ':documento' => $usuarioIngresado,
            ':email' => $usuarioIngresado,
            ':documento_prioridad' => $usuarioIngresado
        ]);
        $empleado = $stmtEmpleado->fetch(PDO::FETCH_ASSOC);

        $estadoEmpleado = strtolower(trim((string) ($empleado['estado'] ?? '')));
        if (
            $empleado
            && $password === (string) $empleado['documento']
            && !str_contains($estadoEmpleado, 'deshabil')
            && !str_contains($estadoEmpleado, 'inactivo')
            && in_array(
                strtolower(trim((string) $empleado['cargo'])),
                ['administrador', 'recepcionista'],
                true
            )
        ) {
            $pdo->beginTransaction();
            $stmtUsuario = $pdo->prepare(
                "INSERT INTO usuarios (documento, email, password, estado, rol, fecha_registro)
                 VALUES (:documento, :email, :password, 'Activo', :rol, NOW())"
            );
            $stmtUsuario->execute([
                ':documento' => $empleado['documento'],
                ':email' => $empleado['email'] ?? '',
                ':password' => password_hash((string) $empleado['documento'], PASSWORD_DEFAULT),
                ':rol' => strtolower(trim((string) $empleado['cargo']))
            ]);
            $pdo->commit();

            $stmtUsuario = $pdo->prepare(
                "SELECT id_usuario, documento, email, password, estado, rol
                 FROM usuarios
                 WHERE documento = :documento
                 LIMIT 1"
            );
            $stmtUsuario->execute([':documento' => $empleado['documento']]);
            $cuenta = $stmtUsuario->fetch(PDO::FETCH_ASSOC);
        }
    }

    if (!$cuenta) {
        responderAuth(401, ['success' => false, 'message' => 'Usuario o contraseña incorrectos, o cuenta inactiva']);
    }

    session_regenerate_id(true);
    $_SESSION['id_usuario'] = (int) $cuenta['id_usuario'];

    responderAuth(200, [
        'success' => true,
        'usuario' => [
            'documento' => $cuenta['documento'],
            'email' => $cuenta['email'],
            'rol' => $cuenta['rol']
        ]
    ]);
} catch (PDOException $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Error al iniciar sesión: ' . $error->getMessage());
    responderAuth(500, ['success' => false, 'message' => 'No se pudo iniciar sesión. Inténtalo de nuevo.']);
}
