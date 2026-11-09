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
    responder(401, ['exito' => false, 'mensaje' => 'Verifica nuevamente tu teléfono para consultar el pago.']);
}

$entrada = leerEntrada();
$referencia = trim((string) ($entrada['referencia'] ?? ''));
if (!preg_match('/^INN[A-F0-9]{24}$/', $referencia)) {
    responder(400, ['exito' => false, 'mensaje' => 'La referencia de pago no es válida.']);
}

try {
    $stmt = $pdo->prepare(
        'SELECT p.estado, p.monto, r.monto_total
         FROM pagos p
         INNER JOIN reservas r ON r.id_reserva = p.id_reserva
         WHERE p.referencia_transaccion = :referencia
           AND r.id_cliente = :id_cliente
         LIMIT 1'
    );
    $stmt->execute([
        ':referencia' => $referencia,
        ':id_cliente' => (int) $verificacion['cliente_id'],
    ]);
    $pago = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$pago) {
        responder(404, ['exito' => false, 'mensaje' => 'No encontramos el pago asociado a tu reserva.']);
    }

    responder(200, [
        'exito' => true,
        'estado' => $pago['estado'],
        'monto' => $pago['monto'],
        'totalReserva' => $pago['monto_total'],
    ]);
} catch (PDOException $error) {
    error_log('No se pudo consultar el estado de un pago: ' . $error->getMessage());
    responder(500, ['exito' => false, 'mensaje' => 'No se pudo consultar el estado del pago. Inténtalo nuevamente.']);
}
