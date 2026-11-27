<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    responderReservas(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$fechaEntrada = trim((string) ($_GET['fecha_entrada'] ?? ''));
$fechaSalida = trim((string) ($_GET['fecha_salida'] ?? ''));
$fechaEntradaObj = DateTimeImmutable::createFromFormat('!Y-m-d', $fechaEntrada);
$fechaSalidaObj = DateTimeImmutable::createFromFormat('!Y-m-d', $fechaSalida);

if (
    !$fechaEntradaObj || $fechaEntradaObj->format('Y-m-d') !== $fechaEntrada
    || !$fechaSalidaObj || $fechaSalidaObj->format('Y-m-d') !== $fechaSalida
    || $fechaEntradaObj < new DateTimeImmutable('today')
    || $fechaSalidaObj <= $fechaEntradaObj
) {
    responderReservas(400, ['exito' => false, 'mensaje' => 'Las fechas de estadía no son válidas.']);
}

try {
    $contarHabitaciones = $pdo->query(
        "SELECT LOWER(TRIM(tipo)) AS tipo, COUNT(*) AS cantidad
         FROM habitaciones
         WHERE LOWER(TRIM(COALESCE(estado, ''))) = 'disponible'
         GROUP BY LOWER(TRIM(tipo))"
    );
    $cantidadesPorTipo = [];
    foreach ($contarHabitaciones->fetchAll(PDO::FETCH_ASSOC) as $fila) {
        $cantidadesPorTipo[(string) $fila['tipo']] = (int) $fila['cantidad'];
    }

    $contarReservasActivas = $pdo->prepare(
        "SELECT LOWER(TRIM(COALESCE(NULLIF(r.tipo_habitacion_solicitada, ''), h.tipo, ''))) AS tipo,
                COUNT(*) AS cantidad
         FROM reservas r
         LEFT JOIN habitaciones h ON h.id_habitacion = r.habitaciones_id_habitacion
         WHERE DATE(r.fecha_entrada) < :fecha_salida
           AND DATE(r.fecha_salida) > :fecha_entrada
           AND LOWER(TRIM(COALESCE(r.estado, ''))) NOT IN (
               'cancelada', 'cancelado', 'pago rechazado', 'rechazada'
           )
           AND (
               LOWER(TRIM(COALESCE(r.estado, ''))) <> 'pendiente de pago'
               OR r.fecha_reserva >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
           )
         GROUP BY LOWER(TRIM(COALESCE(NULLIF(r.tipo_habitacion_solicitada, ''), h.tipo, '')))"
    );
    $contarReservasActivas->execute([
        ':fecha_salida' => $fechaSalida,
        ':fecha_entrada' => $fechaEntrada,
    ]);

    foreach ($contarReservasActivas->fetchAll(PDO::FETCH_ASSOC) as $fila) {
        $tipo = (string) $fila['tipo'];
        $cantidadesPorTipo[$tipo] = max(
            0,
            ($cantidadesPorTipo[$tipo] ?? 0) - (int) $fila['cantidad']
        );
    }

    responderReservas(200, [
        'exito' => true,
        'disponibilidad' => $cantidadesPorTipo,
    ]);
} catch (PDOException $error) {
    error_log('No se pudo consultar la disponibilidad pública: ' . $error->getMessage());
    responderReservas(500, ['exito' => false, 'mensaje' => 'No se pudo consultar la disponibilidad.']);
}
