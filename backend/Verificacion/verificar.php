<?php
require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$entrada = leerEntrada();
$telefono = trim((string) ($entrada['telefono'] ?? ''));
$codigo = trim((string) ($entrada['codigo'] ?? ''));

if (!preg_match('/^\+[1-9]\d{7,14}$/', $telefono) || !preg_match('/^\d{4}$/', $codigo)) {
    responder(400, [
        'exito' => false,
        'mensaje' => 'Ingresa un teléfono válido y un código de 4 dígitos.'
    ]);
}

$claveOtp = 'otp_' . hash('sha256', $telefono);
$datosOtp = $_SESSION[$claveOtp] ?? null;
if (!is_array($datosOtp) || !isset($datosOtp['codigo'], $datosOtp['expiracion'], $datosOtp['intentos'])) {
    unset($_SESSION[$claveOtp]);
    responder(400, ['exito' => false, 'mensaje' => 'No hay un código pendiente para este número.']);
}

if (time() >= (int) $datosOtp['expiracion']) {
    unset($_SESSION[$claveOtp]);
    responder(400, ['exito' => false, 'mensaje' => 'El código expiró. Solicita uno nuevo.']);
}

$cliente = $datosOtp['cliente'] ?? null;
if (
    !is_array($cliente)
    || !isset($cliente['nombre'], $cliente['apellido'], $cliente['email'])
    || !filter_var((string) $cliente['email'], FILTER_VALIDATE_EMAIL)
) {
    unset($_SESSION[$claveOtp]);
    responder(400, ['exito' => false, 'mensaje' => 'Los datos de la reserva ya no están disponibles. Vuelve a solicitar un código.']);
}

if (!hash_equals((string) $datosOtp['codigo'], $codigo)) {
    $_SESSION[$claveOtp]['intentos']++;
    if ($_SESSION[$claveOtp]['intentos'] >= 5) {
        unset($_SESSION[$claveOtp]);
        responder(400, ['exito' => false, 'mensaje' => 'Se alcanzó el límite de intentos. Solicita un nuevo código.']);
    }

    responder(400, ['exito' => false, 'mensaje' => 'El código ingresado es incorrecto.']);
}

$clienteId = null;
try {
    require_once __DIR__ . '/../config/database.php';
    $pdo->beginTransaction();

    $buscarCliente = $pdo->prepare(
        'SELECT id_cliente FROM clientes WHERE telefono = :telefono LIMIT 1 FOR UPDATE'
    );
    $buscarCliente->execute([':telefono' => $telefono]);
    $clienteExistente = $buscarCliente->fetch(PDO::FETCH_ASSOC);

    if ($clienteExistente) {
        $clienteId = (int) $clienteExistente['id_cliente'];
        $actualizarCliente = $pdo->prepare(
            'UPDATE clientes SET nombre = :nombre, apellido = :apellido, email = :email WHERE id_cliente = :id_cliente'
        );
        $actualizarCliente->execute([
            ':nombre' => $cliente['nombre'],
            ':apellido' => $cliente['apellido'],
            ':email' => $cliente['email'],
            ':id_cliente' => $clienteId
        ]);
    } else {
        $crearCliente = $pdo->prepare(
            'INSERT INTO clientes (documento, nombre, apellido, tipo_documento, telefono, email, ciudad_re)
             VALUES (NULL, :nombre, :apellido, NULL, :telefono, :email, NULL)'
        );
        $crearCliente->execute([
            ':nombre' => $cliente['nombre'],
            ':apellido' => $cliente['apellido'],
            ':telefono' => $telefono,
            ':email' => $cliente['email']
        ]);
        $clienteId = (int) $pdo->lastInsertId();
    }

    $pdo->commit();
} catch (PDOException $error) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('No se pudo registrar el cliente después de verificar el teléfono: ' . $error->getCode());
    responder(500, ['exito' => false, 'mensaje' => 'No se pudo guardar la información del cliente. Inténtalo nuevamente.']);
}

unset($_SESSION[$claveOtp]);
$_SESSION['telefono_verificado'] = [
    'telefono' => $telefono,
    'cliente_id' => $clienteId,
    'expiracion' => time() + 1800
];

responder(200, [
    'exito' => true,
    'mensaje' => 'Número verificado y datos del cliente guardados correctamente.',
    'id_cliente' => $clienteId
]);
