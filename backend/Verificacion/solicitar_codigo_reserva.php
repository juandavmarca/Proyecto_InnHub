<?php
declare(strict_types=1);

require_once __DIR__ . '/reserva_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$entrada = leerEntrada();
$telefono = trim((string) ($entrada['telefono'] ?? ''));
if (!preg_match('/^\+[1-9]\d{7,14}$/', $telefono)) {
    responder(400, ['exito' => false, 'mensaje' => 'Ingresa el teléfono con código de país, por ejemplo +573001234567.']);
}

try {
    $clientes = buscarClientesConReservas($telefono);
    if (!$clientes) {
        responder(404, ['exito' => false, 'mensaje' => 'No encontramos reservas asociadas a ese número de teléfono.']);
    }

    $claveTelefono = hash('sha256', normalizarTelefonoReserva($telefono));
    $ultimoEnvio = (int) ($_SESSION['reserva_otp_ultimo_envio'][$claveTelefono] ?? 0);
    $segundosRestantes = 60 - (time() - $ultimoEnvio);
    if ($ultimoEnvio > 0 && $segundosRestantes > 0) {
        responder(429, ['exito' => false, 'mensaje' => "Espera {$segundosRestantes} segundos antes de solicitar otro código."]);
    }

    $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    enviarCodigoReservaWhatsapp($telefono, $codigo);

    $expiracion = time() + 180;
    $_SESSION['reserva_otp_' . $claveTelefono] = [
        'codigo' => $codigo,
        'clientes' => $clientes,
        'expiracion' => $expiracion,
        'intentos' => 0
    ];
    $_SESSION['reserva_otp_ultimo_envio'][$claveTelefono] = time();

    responder(200, [
        'exito' => true,
        'mensaje' => 'Enviamos un código de verificación por WhatsApp.',
        'expiresAt' => gmdate('c', $expiracion)
    ]);
} catch (PDOException $error) {
    error_log('No se pudo buscar reservas para enviar código: ' . $error->getMessage());
    responder(500, ['exito' => false, 'mensaje' => 'No se pudo consultar la reserva. Inténtalo nuevamente.']);
}
