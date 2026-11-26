<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    responderReservas(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

autorizarRecepcion();
$fechaEntrada = trim((string) ($_GET['fecha_entrada'] ?? ''));
$fechaSalida = trim((string) ($_GET['fecha_salida'] ?? ''));
$tipoHabitacion = trim((string) ($_GET['tipo_habitacion'] ?? ''));
$fechaEntradaObj = DateTimeImmutable::createFromFormat('!Y-m-d', $fechaEntrada);
$fechaSalidaObj = DateTimeImmutable::createFromFormat('!Y-m-d', $fechaSalida);

if (
    !$fechaEntradaObj || $fechaEntradaObj->format('Y-m-d') !== $fechaEntrada
    || !$fechaSalidaObj || $fechaSalidaObj->format('Y-m-d') !== $fechaSalida
    || $fechaEntradaObj < new DateTimeImmutable('today')
    || $fechaSalidaObj <= $fechaEntradaObj
    || $tipoHabitacion === '' || strlen($tipoHabitacion) > 50
) {
    responderReservas(400, ['exito' => false, 'mensaje' => 'Las fechas o el tipo de habitación no son válidos.']);
}

try {
    $contarHabitaciones = $pdo->prepare(
        "SELECT COUNT(*)
         FROM habitaciones
         WHERE LOWER(TRIM(tipo)) = LOWER(TRIM(:tipo_habitacion))
           AND LOWER(TRIM(COALESCE(estado, ''))) = 'disponible'"
    );
    $contarHabitaciones->execute([':tipo_habitacion' => $tipoHabitacion]);
    $cantidadHabitaciones = (int) $contarHabitaciones->fetchColumn();

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
        ':tipo_habitacion' => $tipoHabitacion,
        ':fecha_salida' => $fechaSalida,
        ':fecha_entrada' => $fechaEntrada,
    ]);
    $capacidadOcupada = (int) $contarReservasActivas->fetchColumn() >= $cantidadHabitaciones;

    $buscarHabitaciones = $pdo->prepare(
        "SELECT h.id_habitacion, h.numero, h.tipo, h.estado,
                CASE
                    WHEN LOWER(TRIM(COALESCE(h.estado, ''))) <> 'disponible' THEN 0
                    WHEN EXISTS (
                        SELECT 1
                        FROM reservas r2
                        WHERE r2.habitaciones_id_habitacion = h.id_habitacion
                          AND DATE(r2.fecha_entrada) < :fecha_salida
                          AND DATE(r2.fecha_salida) > :fecha_entrada
                          AND LOWER(TRIM(COALESCE(r2.estado, ''))) NOT IN (
                              'cancelada', 'cancelado', 'pago rechazado', 'rechazada'
                          )
                          AND (
                              LOWER(TRIM(COALESCE(r2.estado, ''))) <> 'pendiente de pago'
                              OR r2.fecha_reserva >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                          )
                    ) THEN 0
                    ELSE 1
                END AS disponible
         FROM habitaciones h
         WHERE LOWER(TRIM(h.tipo)) = LOWER(TRIM(:tipo_habitacion))
         ORDER BY CAST(h.numero AS UNSIGNED), h.numero"
    );
    $buscarHabitaciones->execute([
        ':fecha_salida' => $fechaSalida,
        ':fecha_entrada' => $fechaEntrada,
        ':tipo_habitacion' => $tipoHabitacion,
    ]);
    $habitaciones = $buscarHabitaciones->fetchAll(PDO::FETCH_ASSOC);

    if ($capacidadOcupada) {
        foreach ($habitaciones as &$habitacion) {
            $habitacion['disponible'] = 0;
        }
        unset($habitacion);
    }

    responderReservas(200, ['exito' => true, 'habitaciones' => $habitaciones]);
} catch (PDOException $error) {
    error_log('No se pudieron consultar habitaciones para una nueva reserva: ' . $error->getMessage());
    responderReservas(500, ['exito' => false, 'mensaje' => 'No se pudieron consultar las habitaciones disponibles.']);
}
