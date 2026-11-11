<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$verificacion = $_SESSION['telefono_verificado'] ?? null;
if (
    !is_array($verificacion)
    || !isset($verificacion['cliente_id'], $verificacion['expiracion'])
    || time() >= (int) $verificacion['expiracion']
) {
    unset($_SESSION['telefono_verificado']);
    responder(401, ['exito' => false, 'mensaje' => 'Verifica nuevamente tu teléfono para continuar.']);
}

$entrada = leerEntrada();
$fechaEntrada = trim((string) ($entrada['fecha_entrada'] ?? ''));
$fechaSalida = trim((string) ($entrada['fecha_salida'] ?? ''));
$idHabitacion = filter_var($entrada['id_habitacion'] ?? null, FILTER_VALIDATE_INT);
$personas = filter_var($entrada['numero_persona'] ?? null, FILTER_VALIDATE_INT);
$porcentaje = filter_var($entrada['porcentaje_pago'] ?? null, FILTER_VALIDATE_INT);
$fechaEntradaObj = DateTimeImmutable::createFromFormat('!Y-m-d', $fechaEntrada);
$fechaSalidaObj = DateTimeImmutable::createFromFormat('!Y-m-d', $fechaSalida);
$hoy = new DateTimeImmutable('today');

if (
    !$fechaEntradaObj || $fechaEntradaObj->format('Y-m-d') !== $fechaEntrada
    || !$fechaSalidaObj || $fechaSalidaObj->format('Y-m-d') !== $fechaSalida
    || $fechaEntradaObj < $hoy || $fechaSalidaObj <= $fechaEntradaObj
    || !$idHabitacion || $idHabitacion < 1
    || !$personas || $personas < 1 || $personas > 6
    || !in_array($porcentaje, [50, 100], true)
) {
    responder(400, ['exito' => false, 'mensaje' => 'Los datos de la estadía o del pago no son válidos.']);
}

$tarifaPorPersona = 65000;
$noches = (int) $fechaEntradaObj->diff($fechaSalidaObj)->days;
$totalPesos = $tarifaPorPersona * $personas * $noches;
$montoPesos = $porcentaje === 50 ? intdiv($totalPesos, 2) : $totalPesos;
$montoCentavos = $montoPesos * 100;
$configuracion = cargarConfiguracionWompi();

try {
    $pdo->beginTransaction();

    $buscarCliente = $pdo->prepare(
        'SELECT nombre, apellido, email, telefono
         FROM clientes
         WHERE id_cliente = :id_cliente
         LIMIT 1'
    );
    $buscarCliente->execute([':id_cliente' => (int) $verificacion['cliente_id']]);
    $cliente = $buscarCliente->fetch(PDO::FETCH_ASSOC);
    if (!$cliente) {
        $pdo->rollBack();
        responder(401, ['exito' => false, 'mensaje' => 'No encontramos tus datos verificados. Vuelve a verificar tu teléfono.']);
    }

    $buscarHabitacion = $pdo->prepare(
        'SELECT estado
         FROM habitaciones
         WHERE id_habitacion = :id_habitacion
         FOR UPDATE'
    );
    $buscarHabitacion->execute([':id_habitacion' => $idHabitacion]);
    $habitacion = $buscarHabitacion->fetch(PDO::FETCH_ASSOC);
    if (!$habitacion || strtolower(trim((string) $habitacion['estado'])) !== 'disponible') {
        $pdo->rollBack();
        responder(409, ['exito' => false, 'mensaje' => 'La habitación seleccionada ya no está disponible. Elige otra habitación.']);
    }

    $buscarCruce = $pdo->prepare(
        "SELECT id_reserva
         FROM reservas
         WHERE habitaciones_id_habitacion = :id_habitacion
           AND DATE(fecha_entrada) < :fecha_salida
           AND DATE(fecha_salida) > :fecha_entrada
           AND LOWER(COALESCE(estado, '')) NOT IN ('cancelada', 'cancelado', 'pago rechazado', 'rechazada')
           AND (
               LOWER(COALESCE(estado, '')) <> 'pendiente de pago'
               OR fecha_reserva >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
           )
         LIMIT 1"
    );
    $buscarCruce->execute([
        ':id_habitacion' => $idHabitacion,
        ':fecha_salida' => $fechaSalida,
        ':fecha_entrada' => $fechaEntrada,
    ]);
    if ($buscarCruce->fetch(PDO::FETCH_ASSOC)) {
        $pdo->rollBack();
        responder(409, ['exito' => false, 'mensaje' => 'La habitación ya tiene una reserva para esas fechas. Elige otras fechas.']);
    }

    $referencia = 'INN' . strtoupper(bin2hex(random_bytes(12)));
    $observacion = $porcentaje === 50 ? 'Abono del 50% con Wompi' : 'Pago total con Wompi';
    $crearReserva = $pdo->prepare(
        "INSERT INTO reservas
            (fecha_reserva, fecha_entrada, fecha_salida, estado, id_cliente, id_empleado,
             habitaciones_id_habitacion, numero_persona, observacion, monto_total)
         VALUES
            (NOW(), :fecha_entrada, :fecha_salida, 'Pendiente de pago', :id_cliente, NULL,
             :id_habitacion, :numero_persona, :observacion, :monto_total)"
    );
    $crearReserva->execute([
        ':fecha_entrada' => $fechaEntrada . ' 00:00:00',
        ':fecha_salida' => $fechaSalida . ' 00:00:00',
        ':id_cliente' => (int) $verificacion['cliente_id'],
        ':id_habitacion' => $idHabitacion,
        ':numero_persona' => $personas,
        ':observacion' => $observacion,
        ':monto_total' => $totalPesos,
    ]);
    $idReserva = (int) $pdo->lastInsertId();

    $crearPago = $pdo->prepare(
        "INSERT INTO pagos (monto, metodo_pago, estado, id_reserva, referencia_transaccion)
         VALUES (:monto, 'Wompi', 'PENDING', :id_reserva, :referencia)"
    );
    $crearPago->execute([
        ':monto' => $montoPesos,
        ':id_reserva' => $idReserva,
        ':referencia' => $referencia,
    ]);

    $pdo->commit();
} catch (PDOException $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('No se pudo iniciar el pago de una reserva: ' . $error->getMessage());
    responder(500, ['exito' => false, 'mensaje' => 'No se pudo iniciar el pago. Inténtalo nuevamente.']);
}

$expiracion = gmdate('Y-m-d\TH:i:s.000\Z', time() + 1800);
$urlRetorno = $configuracion['urlRetorno'];
$partesUrlRetorno = parse_url($urlRetorno);
$hostRetorno = strtolower(trim((string) ($partesUrlRetorno['host'] ?? ''), '[]'));
$urlRetornoCheckout = null;
if (
    is_array($partesUrlRetorno)
    && strtolower((string) ($partesUrlRetorno['scheme'] ?? '')) === 'https'
    && $hostRetorno !== ''
    && !in_array($hostRetorno, ['localhost', '127.0.0.1', '::1'], true)
) {
    $separador = str_contains($urlRetorno, '?') ? '&' : '?';
    $urlRetornoCheckout = $urlRetorno . $separador . 'pago=' . rawurlencode($referencia);
}

responder(200, [
    'exito' => true,
    'referencia' => $referencia,
    'llavePublica' => $configuracion['llavePublica'],
    'montoCentavos' => $montoCentavos,
    'firmaIntegridad' => crearFirmaIntegridad(
        $referencia,
        $montoCentavos,
        $expiracion,
        $configuracion['secretoIntegridad']
    ),
    'expiracion' => $expiracion,
    'urlRetorno' => $urlRetornoCheckout,
    'cliente' => [
        'nombreCompleto' => trim($cliente['nombre'] . ' ' . $cliente['apellido']),
        'email' => $cliente['email'],
        'telefono' => $cliente['telefono'],
    ],
]);
