<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../Reservas/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$idCliente = null;
if ((int) ($_SESSION['id_usuario'] ?? 0) > 0) {
    autorizarRecepcion();
} else {
    $verificacion = $_SESSION['telefono_verificado'] ?? null;
    if (
        !is_array($verificacion)
        || !isset($verificacion['cliente_id'], $verificacion['expiracion'])
        || time() >= (int) $verificacion['expiracion']
    ) {
        unset($_SESSION['telefono_verificado']);
        responder(401, ['exito' => false, 'mensaje' => 'Verifica nuevamente tu teléfono para consultar el pago.']);
    }
    $idCliente = (int) $verificacion['cliente_id'];
}

$entrada = leerEntrada();
$referencia = trim((string) ($entrada['referencia'] ?? ''));
if (!preg_match('/^INN[A-F0-9]{24}$/', $referencia)) {
    responder(400, ['exito' => false, 'mensaje' => 'La referencia de pago no es válida.']);
}

try {
    $sql =
        'SELECT p.estado, p.monto, r.monto_total, r.id_reserva, r.estado AS estado_reserva,
                r.habitaciones_id_habitacion AS id_habitacion, h.numero AS numero_habitacion
         FROM pagos p
         INNER JOIN reservas r ON r.id_reserva = p.id_reserva
         LEFT JOIN habitaciones h ON h.id_habitacion = r.habitaciones_id_habitacion
         WHERE p.referencia_transaccion = :referencia';
    if ($idCliente !== null) {
        $sql .= ' AND r.id_cliente = :id_cliente';
    }
    $stmt = $pdo->prepare($sql . ' LIMIT 1');
    $parametros = [':referencia' => $referencia];
    if ($idCliente !== null) {
        $parametros[':id_cliente'] = $idCliente;
    }
    $stmt->execute($parametros);
    $pago = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$pago) {
        responder(404, ['exito' => false, 'mensaje' => 'No encontramos el pago asociado a tu reserva.']);
    }

    responder(200, [
        'exito' => true,
        'estado' => $pago['estado'],
        'monto' => $pago['monto'],
        'totalReserva' => $pago['monto_total'],
        'id_reserva' => (int) $pago['id_reserva'],
        'estado_reserva' => $pago['estado_reserva'],
        'id_habitacion' => $pago['id_habitacion'] === null ? null : (int) $pago['id_habitacion'],
        'numero_habitacion' => $pago['numero_habitacion'],
    ]);
} catch (PDOException $error) {
    error_log('No se pudo consultar el estado de un pago: ' . $error->getMessage());
    responder(500, ['exito' => false, 'mensaje' => 'No se pudo consultar el estado del pago. Inténtalo nuevamente.']);
}
