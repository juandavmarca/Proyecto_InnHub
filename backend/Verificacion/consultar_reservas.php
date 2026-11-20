<?php
declare(strict_types=1);

require_once __DIR__ . '/reserva_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$verificacion = $_SESSION['reserva_consulta_verificada'] ?? null;
if (
    !is_array($verificacion)
    || !isset($verificacion['clientes'], $verificacion['expiracion'])
    || time() >= (int) $verificacion['expiracion']
    || !is_array($verificacion['clientes'])
) {
    unset($_SESSION['reserva_consulta_verificada']);
    responder(401, ['exito' => false, 'mensaje' => 'Vuelve a verificar tu teléfono para consultar las reservas.']);
}

try {
    $reservas = consultarReservasDeClientes($verificacion['clientes']);
    responder(200, [
        'exito' => true,
        'reservas' => $reservas,
    ]);
} catch (PDOException $error) {
    error_log('No se pudieron actualizar las reservas verificadas: ' . $error->getMessage());
    responder(500, ['exito' => false, 'mensaje' => 'No se pudieron actualizar las reservas. Inténtalo nuevamente.']);
}
