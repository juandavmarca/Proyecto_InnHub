<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../Pagos/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderReservas(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$usuario = autorizarRecepcion();
$entrada = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($entrada)) {
    responderReservas(400, ['exito' => false, 'mensaje' => 'La solicitud no contiene datos válidos.']);
}

$idCliente = filter_var($entrada['id_cliente'] ?? null, FILTER_VALIDATE_INT);
$idHabitacion = filter_var($entrada['id_habitacion'] ?? null, FILTER_VALIDATE_INT);
$personas = filter_var($entrada['numero_persona'] ?? null, FILTER_VALIDATE_INT);
$porcentaje = filter_var($entrada['porcentaje_pago'] ?? null, FILTER_VALIDATE_INT);
$fechaEntrada = trim((string) ($entrada['fecha_entrada'] ?? ''));
$fechaSalida = trim((string) ($entrada['fecha_salida'] ?? ''));
$fechaEntradaObj = DateTimeImmutable::createFromFormat('!Y-m-d', $fechaEntrada);
$fechaSalidaObj = DateTimeImmutable::createFromFormat('!Y-m-d', $fechaSalida);

if (
    !$idCliente || $idCliente < 1
    || !$idHabitacion || $idHabitacion < 1
    || !$personas || $personas < 1 || $personas > 6
    || !in_array($porcentaje, [50, 100], true)
    || !$fechaEntradaObj || $fechaEntradaObj->format('Y-m-d') !== $fechaEntrada
    || !$fechaSalidaObj || $fechaSalidaObj->format('Y-m-d') !== $fechaSalida
    || $fechaEntradaObj < new DateTimeImmutable('today')
    || $fechaSalidaObj <= $fechaEntradaObj
) {
    responderReservas(400, ['exito' => false, 'mensaje' => 'Revisa el cliente, la habitación, las fechas y los datos del pago.']);
}

$configuracion = cargarConfiguracionWompi();

try {
    $buscarCliente = $pdo->prepare(
        'SELECT id_cliente, nombre, apellido, email, telefono
         FROM clientes
         WHERE id_cliente = :id_cliente
         LIMIT 1'
    );
    $buscarCliente->execute([':id_cliente' => $idCliente]);
    $cliente = $buscarCliente->fetch(PDO::FETCH_ASSOC);
    if (!$cliente || !filter_var((string) $cliente['email'], FILTER_VALIDATE_EMAIL)) {
        responderReservas(400, ['exito' => false, 'mensaje' => 'El cliente debe tener un correo válido para pagar con Wompi.']);
    }

    $pdo->beginTransaction();

    $bloquearHabitaciones = $pdo->prepare(
        "SELECT id_habitacion
         FROM habitaciones
         WHERE LOWER(TRIM(tipo)) = LOWER(TRIM(:tipo_habitacion))
           AND LOWER(TRIM(COALESCE(estado, ''))) = 'disponible'
         ORDER BY id_habitacion
         FOR UPDATE"
    );

    $buscarTipoHabitacion = $pdo->prepare(
        'SELECT tipo FROM habitaciones WHERE id_habitacion = :id_habitacion LIMIT 1'
    );
    $buscarTipoHabitacion->execute([':id_habitacion' => $idHabitacion]);
    $tipoInicial = $buscarTipoHabitacion->fetchColumn();
    if ($tipoInicial === false) {
        $pdo->rollBack();
        responderReservas(404, ['exito' => false, 'mensaje' => 'No encontramos la habitación seleccionada.']);
    }

    $bloquearHabitaciones->execute([':tipo_habitacion' => $tipoInicial]);
    $habitacionesTipoDisponibles = array_map('intval', $bloquearHabitaciones->fetchAll(PDO::FETCH_COLUMN));
    $buscarHabitacion = $pdo->prepare(
        'SELECT id_habitacion, numero, tipo, estado
         FROM habitaciones
         WHERE id_habitacion = :id_habitacion
         LIMIT 1
         FOR UPDATE'
    );
    $buscarHabitacion->execute([':id_habitacion' => $idHabitacion]);
    $habitacion = $buscarHabitacion->fetch(PDO::FETCH_ASSOC);
    if (
        !$habitacion
        || strtolower(trim((string) $habitacion['estado'])) !== 'disponible'
        || strcasecmp(trim((string) $habitacion['tipo']), trim((string) $tipoInicial)) !== 0
        || !in_array((int) $habitacion['id_habitacion'], $habitacionesTipoDisponibles, true)
    ) {
        $pdo->rollBack();
        responderReservas(409, ['exito' => false, 'mensaje' => 'La habitación seleccionada ya no está disponible. Actualiza las opciones.']);
    }

    $contarReservasActivas = $pdo->prepare(
        "SELECT COUNT(*)
         FROM reservas r
         LEFT JOIN habitaciones h ON h.id_habitacion = r.habitaciones_id_habitacion
         WHERE LOWER(TRIM(COALESCE(NULLIF(r.tipo_habitacion_solicitada, ''), h.tipo, '')))
                   = LOWER(TRIM(:tipo_habitacion))
           AND DATE(r.fecha_entrada) < :fecha_salida
           AND DATE(r.fecha_salida) > :fecha_entrada
           AND LOWER(TRIM(COALESCE(r.estado, ''))) NOT IN (
               'cancelada', 'cancelado', 'pago rechazado', 'rechazada'
           )
           AND (
               LOWER(TRIM(COALESCE(r.estado, ''))) <> 'pendiente de pago'
               OR r.fecha_reserva >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
           )"
    );
    $contarReservasActivas->execute([
        ':tipo_habitacion' => $habitacion['tipo'],
        ':fecha_salida' => $fechaSalida,
        ':fecha_entrada' => $fechaEntrada,
    ]);
    if ((int) $contarReservasActivas->fetchColumn() >= count($habitacionesTipoDisponibles)) {
        $pdo->rollBack();
        responderReservas(409, ['exito' => false, 'mensaje' => 'Ya no hay habitaciones de ese tipo disponibles para esas fechas.']);
    }

    $buscarCruce = $pdo->prepare(
        "SELECT id_reserva
         FROM reservas
         WHERE habitaciones_id_habitacion = :id_habitacion
           AND DATE(fecha_entrada) < :fecha_salida
           AND DATE(fecha_salida) > :fecha_entrada
           AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN (
               'cancelada', 'cancelado', 'pago rechazado', 'rechazada'
           )
           AND (
               LOWER(TRIM(COALESCE(estado, ''))) <> 'pendiente de pago'
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
        responderReservas(409, ['exito' => false, 'mensaje' => 'La habitación ya está ocupada o reservada en esas fechas. Elige otra.']);
    }

    $noches = (int) $fechaEntradaObj->diff($fechaSalidaObj)->days;
    $totalPesos = 65000 * $personas * $noches;
    $montoPesos = $porcentaje === 50 ? intdiv($totalPesos, 2) : $totalPesos;
    $montoCentavos = $montoPesos * 100;
    $referencia = 'INN' . strtoupper(bin2hex(random_bytes(12)));
    $expiracion = gmdate('Y-m-d\TH:i:s.000\Z', time() + 1800);
    $observacion = 'Reserva en recepción. Abono del ' . $porcentaje . '% con Wompi.';

    $crearReserva = $pdo->prepare(
        "INSERT INTO reservas
            (fecha_reserva, fecha_entrada, fecha_salida, estado, id_cliente, id_empleado,
             habitaciones_id_habitacion, tipo_habitacion_solicitada, numero_persona, observacion, monto_total)
         VALUES
            (NOW(), :fecha_entrada, :fecha_salida, 'Pendiente de pago', :id_cliente, :id_empleado,
             :id_habitacion, :tipo_habitacion, :numero_persona, :observacion, :monto_total)"
    );
    $crearReserva->execute([
        ':fecha_entrada' => $fechaEntrada . ' 00:00:00',
        ':fecha_salida' => $fechaSalida . ' 00:00:00',
        ':id_cliente' => $idCliente,
        ':id_empleado' => $usuario['id_empleado'],
        ':id_habitacion' => $idHabitacion,
        ':tipo_habitacion' => $habitacion['tipo'],
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
    error_log('No se pudo iniciar un pago de reserva en recepción: ' . $error->getMessage());
    responderReservas(500, ['exito' => false, 'mensaje' => 'No se pudo iniciar el pago de la reserva.']);
}

responderReservas(200, [
    'exito' => true,
    'id_reserva' => $idReserva,
    'referencia' => $referencia,
    'llavePublica' => $configuracion['llavePublica'],
    'montoCentavos' => $montoCentavos,
    'montoTotal' => $totalPesos,
    'montoPagar' => $montoPesos,
    'firmaIntegridad' => crearFirmaIntegridad(
        $referencia,
        $montoCentavos,
        $expiracion,
        $configuracion['secretoIntegridad']
    ),
    'expiracion' => $expiracion,
    'cliente' => [
        'nombreCompleto' => trim($cliente['nombre'] . ' ' . $cliente['apellido']),
        'email' => $cliente['email'],
        'telefono' => $cliente['telefono'],
    ],
]);
