<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderReservas(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$usuario = autorizarRecepcion();
$entrada = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($entrada)) {
    responderReservas(400, ['exito' => false, 'mensaje' => 'La solicitud no contiene datos válidos.']);
}

$idReserva = filter_var($entrada['id_reserva'] ?? null, FILTER_VALIDATE_INT);
$idHabitacion = filter_var($entrada['id_habitacion'] ?? null, FILTER_VALIDATE_INT);
if (!$idReserva || $idReserva < 1 || !$idHabitacion || $idHabitacion < 1) {
    responderReservas(400, ['exito' => false, 'mensaje' => 'Selecciona la reserva y una habitación válidas.']);
}

try {
    $pdo->beginTransaction();

    $buscarReserva = $pdo->prepare(
        'SELECT r.id_reserva, r.fecha_entrada, r.fecha_salida, r.estado,
                COALESCE(NULLIF(TRIM(r.tipo_habitacion_solicitada), \'\'), h.tipo) AS tipo_habitacion
         FROM reservas r
         LEFT JOIN habitaciones h ON h.id_habitacion = r.habitaciones_id_habitacion
         WHERE r.id_reserva = :id_reserva
         LIMIT 1
         FOR UPDATE'
    );
    $buscarReserva->execute([':id_reserva' => $idReserva]);
    $reserva = $buscarReserva->fetch(PDO::FETCH_ASSOC);
    if (!$reserva || !esReservaPendienteDeConfirmacion((string) $reserva['estado'])) {
        $pdo->rollBack();
        responderReservas(409, ['exito' => false, 'mensaje' => 'La reserva ya no está pendiente de confirmación.']);
    }

    $buscarPago = $pdo->prepare(
        "SELECT estado
         FROM pagos
         WHERE id_reserva = :id_reserva
         ORDER BY fecha_pago DESC, id_pago DESC
         LIMIT 1
         FOR UPDATE"
    );
    $buscarPago->execute([':id_reserva' => $idReserva]);
    if (strtoupper((string) $buscarPago->fetchColumn()) !== 'APPROVED') {
        $pdo->rollBack();
        responderReservas(409, ['exito' => false, 'mensaje' => 'La reserva no tiene un pago aprobado.']);
    }

    $buscarHabitacion = $pdo->prepare(
        'SELECT id_habitacion, tipo, estado
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
        || strtolower(trim((string) $habitacion['tipo'])) !== strtolower(trim((string) $reserva['tipo_habitacion']))
    ) {
        $pdo->rollBack();
        responderReservas(409, ['exito' => false, 'mensaje' => 'La habitación ya no está disponible o no corresponde al tipo reservado.']);
    }

    $buscarCruce = $pdo->prepare(
        "SELECT id_reserva
         FROM reservas
         WHERE habitaciones_id_habitacion = :id_habitacion
           AND id_reserva <> :id_reserva
           AND DATE(fecha_entrada) < DATE(:fecha_salida)
           AND DATE(fecha_salida) > DATE(:fecha_entrada)
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
        ':id_reserva' => $idReserva,
        ':fecha_salida' => $reserva['fecha_salida'],
        ':fecha_entrada' => $reserva['fecha_entrada'],
    ]);
    if ($buscarCruce->fetch(PDO::FETCH_ASSOC)) {
        $pdo->rollBack();
        responderReservas(409, ['exito' => false, 'mensaje' => 'La habitación ya está asignada durante esas fechas. Elige otra.']);
    }

    $actualizar = $pdo->prepare(
        "UPDATE reservas
         SET habitaciones_id_habitacion = :id_habitacion,
             tipo_habitacion_solicitada = :tipo_habitacion,
             id_empleado = :id_empleado,
             estado = 'Confirmada'
         WHERE id_reserva = :id_reserva"
    );
    $actualizar->execute([
        ':id_habitacion' => $idHabitacion,
        ':tipo_habitacion' => $habitacion['tipo'],
        ':id_empleado' => $usuario['id_empleado'],
        ':id_reserva' => $idReserva,
    ]);

    $pdo->commit();
    responderReservas(200, [
        'exito' => true,
        'mensaje' => 'Reserva confirmada y habitación asignada. No quedó registrado el empleado responsable.',
    ]);
} catch (PDOException $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('No se pudo confirmar la reserva: ' . $error->getMessage());
    responderReservas(500, ['exito' => false, 'mensaje' => 'No se pudo confirmar la reserva.']);
}
