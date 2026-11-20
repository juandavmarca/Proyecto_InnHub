<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    responderReservas(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

autorizarRecepcion();
$idReserva = filter_var($_GET['id_reserva'] ?? null, FILTER_VALIDATE_INT);
if (!$idReserva || $idReserva < 1) {
    responderReservas(400, ['exito' => false, 'mensaje' => 'La reserva indicada no es válida.']);
}

try {
    $buscarReserva = $pdo->prepare(
        'SELECT r.fecha_entrada, r.fecha_salida, r.estado,
                COALESCE(NULLIF(TRIM(r.tipo_habitacion_solicitada), \'\'), h.tipo) AS tipo_habitacion
         FROM reservas r
         LEFT JOIN habitaciones h ON h.id_habitacion = r.habitaciones_id_habitacion
         WHERE r.id_reserva = :id_reserva
         LIMIT 1'
    );
    $buscarReserva->execute([':id_reserva' => $idReserva]);
    $reserva = $buscarReserva->fetch(PDO::FETCH_ASSOC);

    if (!$reserva || !esReservaPendienteDeConfirmacion((string) $reserva['estado'])) {
        responderReservas(404, ['exito' => false, 'mensaje' => 'La reserva ya no está pendiente de confirmación.']);
    }

    $buscarPago = $pdo->prepare(
        "SELECT estado
         FROM pagos
         WHERE id_reserva = :id_reserva
         ORDER BY fecha_pago DESC, id_pago DESC
         LIMIT 1"
    );
    $buscarPago->execute([':id_reserva' => $idReserva]);
    if (strtoupper((string) $buscarPago->fetchColumn()) !== 'APPROVED') {
        responderReservas(409, ['exito' => false, 'mensaje' => 'La reserva no tiene un pago aprobado.']);
    }

    $stmt = $pdo->prepare(
        "SELECT h.id_habitacion, h.numero, h.tipo, h.estado,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM reservas r2
                        WHERE r2.habitaciones_id_habitacion = h.id_habitacion
                          AND r2.id_reserva <> :id_reserva_exclusion
                          AND DATE(r2.fecha_entrada) < DATE(:fecha_salida)
                          AND DATE(r2.fecha_salida) > DATE(:fecha_entrada)
                          AND LOWER(TRIM(COALESCE(r2.estado, ''))) NOT IN (
                              'cancelada', 'cancelado', 'pago rechazado', 'rechazada'
                          )
                          AND (
                              LOWER(TRIM(COALESCE(r2.estado, ''))) <> 'pendiente de pago'
                              OR r2.fecha_reserva >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                          )
                    ) THEN 0
                    WHEN LOWER(TRIM(COALESCE(h.estado, ''))) <> 'disponible' THEN 0
                    ELSE 1
                END AS disponible
         FROM habitaciones h
         WHERE LOWER(TRIM(h.tipo)) = LOWER(TRIM(:tipo_habitacion))
         ORDER BY CAST(h.numero AS UNSIGNED), h.numero"
    );
    $stmt->execute([
        ':id_reserva_exclusion' => $idReserva,
        ':fecha_salida' => $reserva['fecha_salida'],
        ':fecha_entrada' => $reserva['fecha_entrada'],
        ':tipo_habitacion' => $reserva['tipo_habitacion'],
    ]);

    responderReservas(200, [
        'exito' => true,
        'habitaciones' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (PDOException $error) {
    error_log('No se pudieron cargar habitaciones para asignar: ' . $error->getMessage());
    responderReservas(500, ['exito' => false, 'mensaje' => 'No se pudieron consultar las habitaciones.']);
}
