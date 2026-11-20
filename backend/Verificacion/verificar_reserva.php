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
    $clientesVerificados = array_map('intval', $datosOtp['clientes']);
    $reservas = consultarReservasDeClientes($clientesVerificados);
    $_SESSION['reserva_consulta_verificada'] = [
        'clientes' => $clientesVerificados,
        'expiracion' => time() + 1800,
    ];
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
