<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    responderReservas(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

autorizarRecepcion();

try {
    $stmt = $pdo->query(
        "SELECT r.id_reserva, r.fecha_reserva, r.fecha_entrada, r.fecha_salida,
                r.estado, r.numero_persona, r.observacion, r.monto_total,
                COALESCE(NULLIF(TRIM(r.tipo_habitacion_solicitada), ''), h.tipo) AS tipo_habitacion,
                r.habitaciones_id_habitacion AS id_habitacion,
                h.numero AS numero_habitacion,
                c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
                c.telefono, c.email,
                p.estado AS estado_pago, p.monto AS monto_pagado,
                p.metodo_pago, p.fecha_pago
         FROM reservas r
         INNER JOIN clientes c ON c.id_cliente = r.id_cliente
         LEFT JOIN habitaciones h ON h.id_habitacion = r.habitaciones_id_habitacion
         LEFT JOIN pagos p ON p.id_pago = (
             SELECT p2.id_pago
             FROM pagos p2
             WHERE p2.id_reserva = r.id_reserva
             ORDER BY p2.fecha_pago DESC, p2.id_pago DESC
             LIMIT 1
         )
         WHERE UPPER(COALESCE(p.estado, '')) = 'APPROVED'
           AND LOWER(TRIM(COALESCE(r.estado, ''))) IN ('pendiente de confirmación', 'pago aprobado')
         ORDER BY r.fecha_reserva ASC, r.id_reserva ASC
         LIMIT 100"
    );

    responderReservas(200, [
        'exito' => true,
        'reservas' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (PDOException $error) {
    error_log('No se pudieron cargar las reservas pendientes de recepción: ' . $error->getMessage());
    responderReservas(500, ['exito' => false, 'mensaje' => 'No se pudieron cargar las reservas.']);
}
