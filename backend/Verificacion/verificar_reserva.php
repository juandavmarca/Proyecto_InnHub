<?php
declare(strict_types=1);

require_once __DIR__ . '/reserva_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$entrada = leerEntrada();
$telefono = trim((string) ($entrada['telefono'] ?? ''));
$codigo = trim((string) ($entrada['codigo'] ?? ''));

if (!preg_match('/^\+[1-9]\d{7,14}$/', $telefono) || !preg_match('/^\d{6}$/', $codigo)) {
    responder(400, ['exito' => false, 'mensaje' => 'Ingresa un teléfono válido y el código de 6 dígitos.']);
}

$claveOtp = 'reserva_otp_' . hash('sha256', normalizarTelefonoReserva($telefono));
$datosOtp = $_SESSION[$claveOtp] ?? null;
if (!is_array($datosOtp) || !isset($datosOtp['codigo'], $datosOtp['expiracion'], $datosOtp['intentos'], $datosOtp['clientes'])) {
    unset($_SESSION[$claveOtp]);
    responder(400, ['exito' => false, 'mensaje' => 'No hay un código pendiente para ese número. Solicita uno nuevo.']);
}

if (time() >= (int) $datosOtp['expiracion']) {
    unset($_SESSION[$claveOtp]);
    responder(400, ['exito' => false, 'mensaje' => 'El código expiró. Solicita uno nuevo.']);
}

if (!hash_equals((string) $datosOtp['codigo'], $codigo)) {
    $_SESSION[$claveOtp]['intentos']++;
    if ($_SESSION[$claveOtp]['intentos'] >= 5) {
        unset($_SESSION[$claveOtp]);
        responder(400, ['exito' => false, 'mensaje' => 'Se alcanzó el límite de intentos. Solicita un nuevo código.']);
    }
    responder(400, ['exito' => false, 'mensaje' => 'El código ingresado es incorrecto.']);
}

try {
    $marcadores = implode(',', array_fill(0, count($datosOtp['clientes']), '?'));
    $stmt = $pdo->prepare(
        "SELECT r.id_reserva, r.fecha_reserva, r.fecha_entrada, r.fecha_salida,
                r.estado, r.numero_persona, r.observacion, r.monto_total,
                h.numero AS numero_habitacion, h.tipo AS tipo_habitacion,
                p.estado AS estado_pago, p.monto, p.metodo_pago, p.fecha_pago,
                p.referencia_transaccion
         FROM reservas r
         LEFT JOIN habitaciones h ON h.id_habitacion = r.habitaciones_id_habitacion
         LEFT JOIN pagos p ON p.id_pago = (
             SELECT p2.id_pago
             FROM pagos p2
             WHERE p2.id_reserva = r.id_reserva
             ORDER BY p2.fecha_pago DESC, p2.id_pago DESC
             LIMIT 1
         )
         WHERE r.id_cliente IN ({$marcadores})
         ORDER BY r.fecha_reserva DESC, r.id_reserva DESC"
    );
    $stmt->execute(array_map('intval', $datosOtp['clientes']));
    $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    unset($_SESSION[$claveOtp]);

    responder(200, [
        'exito' => true,
        'mensaje' => 'Número verificado correctamente.',
        'reservas' => $reservas
    ]);
} catch (PDOException $error) {
    error_log('No se pudieron consultar reservas después de verificar teléfono: ' . $error->getMessage());
    responder(500, ['exito' => false, 'mensaje' => 'No se pudieron cargar las reservas. Inténtalo nuevamente.']);
}
