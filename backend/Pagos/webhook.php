<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$configuracion = cargarConfiguracionWompi();
$contenido = file_get_contents('php://input');
$evento = json_decode($contenido === false ? '' : $contenido, true);
if (
    !is_array($evento)
    || ($evento['event'] ?? '') !== 'transaction.updated'
    || !is_array($evento['data']['transaction'] ?? null)
    || !is_array($evento['signature'] ?? null)
    || !is_array($evento['signature']['properties'] ?? null)
    || !isset($evento['signature']['checksum'], $evento['timestamp'])
) {
    responder(400, ['exito' => false, 'mensaje' => 'El evento de pago no tiene un formato válido.']);
}

if (($evento['environment'] ?? '') !== $configuracion['ambiente']) {
    responder(400, ['exito' => false, 'mensaje' => 'El evento pertenece a otro ambiente de Wompi.']);
}

$valoresFirmados = [];
foreach ($evento['signature']['properties'] as $propiedad) {
    if (!is_string($propiedad) || $propiedad === '') {
        responder(400, ['exito' => false, 'mensaje' => 'La firma del evento no es válida.']);
    }

    $valor = $evento['data'];
    foreach (explode('.', $propiedad) as $segmento) {
        if (!is_array($valor) || !array_key_exists($segmento, $valor)) {
            responder(400, ['exito' => false, 'mensaje' => 'La firma del evento no es válida.']);
        }
        $valor = $valor[$segmento];
    }
    if (!is_scalar($valor)) {
        responder(400, ['exito' => false, 'mensaje' => 'La firma del evento no es válida.']);
    }
    $valoresFirmados[] = (string) $valor;
}

if (!$valoresFirmados || !is_numeric($evento['timestamp'])) {
    responder(400, ['exito' => false, 'mensaje' => 'La firma del evento no es válida.']);
}

$firmaCalculada = hash(
    'sha256',
    implode('', $valoresFirmados) . (string) $evento['timestamp'] . $configuracion['secretoEventos']
);
$firmaRecibida = strtolower((string) $evento['signature']['checksum']);
if (!hash_equals($firmaCalculada, $firmaRecibida)) {
    error_log('Wompi envió un evento con una firma inválida.');
    responder(401, ['exito' => false, 'mensaje' => 'No se pudo validar la firma del evento.']);
}

$transaccion = $evento['data']['transaction'];
$referencia = trim((string) ($transaccion['reference'] ?? ''));
$estado = strtoupper(trim((string) ($transaccion['status'] ?? '')));
$montoCentavos = filter_var($transaccion['amount_in_cents'] ?? null, FILTER_VALIDATE_INT);
if (
    !preg_match('/^INN[A-F0-9]{24}$/', $referencia)
    || !in_array($estado, ['PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR'], true)
    || $montoCentavos === false
    || ($transaccion['currency'] ?? '') !== 'COP'
) {
    responder(400, ['exito' => false, 'mensaje' => 'La transacción del evento no es válida.']);
}

try {
    $pdo->beginTransaction();
    $buscarPago = $pdo->prepare(
        'SELECT p.id_pago, p.estado, p.monto, r.id_reserva
         FROM pagos p
         INNER JOIN reservas r ON r.id_reserva = p.id_reserva
         WHERE p.referencia_transaccion = :referencia
         LIMIT 1
         FOR UPDATE'
    );
    $buscarPago->execute([':referencia' => $referencia]);
    $pago = $buscarPago->fetch(PDO::FETCH_ASSOC);
    if (!$pago) {
        $pdo->rollBack();
        responder(404, ['exito' => false, 'mensaje' => 'No se encontró la reserva de este pago.']);
    }

    if ((int) round((float) $pago['monto'] * 100) !== $montoCentavos) {
        $pdo->rollBack();
        error_log('El monto del evento de Wompi no coincide con el pago registrado.');
        responder(400, ['exito' => false, 'mensaje' => 'El monto de la transacción no coincide.']);
    }

    $estadoActual = strtoupper((string) $pago['estado']);
    $estadoActualFinal = in_array($estadoActual, ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'], true);
    if ($estadoActual !== 'APPROVED' && !($estadoActualFinal && $estado === 'PENDING')) {
        $actualizarPago = $pdo->prepare(
            "UPDATE pagos
             SET estado = :estado,
                 fecha_pago = CASE WHEN :estado_fecha = 'APPROVED' THEN CURRENT_TIMESTAMP ELSE fecha_pago END
             WHERE id_pago = :id_pago"
        );
        $actualizarPago->execute([
            ':estado' => $estado,
            ':estado_fecha' => $estado,
            ':id_pago' => (int) $pago['id_pago'],
        ]);

        if ($estado === 'APPROVED') {
            $actualizarReserva = $pdo->prepare(
                "UPDATE reservas
                 SET estado = 'Pago aprobado'
                 WHERE id_reserva = :id_reserva
                   AND estado IN ('Pendiente de pago', 'Pago rechazado')"
            );
            $actualizarReserva->execute([':id_reserva' => (int) $pago['id_reserva']]);
        } elseif (in_array($estado, ['DECLINED', 'VOIDED', 'ERROR'], true)) {
            $actualizarReserva = $pdo->prepare(
                "UPDATE reservas
                 SET estado = 'Pago rechazado'
                 WHERE id_reserva = :id_reserva
                   AND estado = 'Pendiente de pago'"
            );
            $actualizarReserva->execute([':id_reserva' => (int) $pago['id_reserva']]);
        }
    }

    $pdo->commit();
    responder(200, ['exito' => true]);
} catch (PDOException $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('No se pudo aplicar el evento de Wompi: ' . $error->getMessage());
    responder(500, ['exito' => false, 'mensaje' => 'No se pudo procesar el evento de pago.']);
}
