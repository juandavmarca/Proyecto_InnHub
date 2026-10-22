<?php
require_once __DIR__ . '/common.php';
require_once __DIR__ . '/correo_aceptacion.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$verificacion = $_SESSION['telefono_verificado'] ?? null;
if (
    !is_array($verificacion)
    || !isset($verificacion['telefono'], $verificacion['cliente_id'], $verificacion['expiracion'])
    || time() >= (int) $verificacion['expiracion']
) {
    unset($_SESSION['telefono_verificado']);
    responder(401, ['exito' => false, 'mensaje' => 'Verifica nuevamente tu teléfono para reenviar el correo.']);
}

$idCliente = (int) $verificacion['cliente_id'];
$telefono = (string) $verificacion['telefono'];
$ultimoIntento = (int) ($_SESSION['reenvio_correo_ultimo_intento'][$idCliente] ?? 0);
$segundosRestantes = 60 - (time() - $ultimoIntento);
if ($ultimoIntento > 0 && $segundosRestantes > 0) {
    responder(429, [
        'exito' => false,
        'mensaje' => "Espera {$segundosRestantes} segundos antes de reintentar el envío."
    ]);
}

try {
    require_once __DIR__ . '/../config/database.php';
    $buscarAceptacion = $pdo->prepare(
        'SELECT nombre, email, fecha_aceptacion_utc
         FROM aceptaciones_terminos
         WHERE id_cliente = :id_cliente AND telefono = :telefono
         ORDER BY fecha_aceptacion_utc DESC, id_aceptacion DESC
         LIMIT 1'
    );
    $buscarAceptacion->execute([
        ':id_cliente' => $idCliente,
        ':telefono' => $telefono
    ]);
    $aceptacion = $buscarAceptacion->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $error) {
    error_log('No se pudo consultar la aceptación para reenviar el correo. SQLSTATE '
        . $error->getCode() . ': ' . $error->getMessage());
    responder(500, ['exito' => false, 'mensaje' => 'No se pudo consultar la aceptación. Inténtalo más tarde.']);
}

if (
    !$aceptacion
    || !filter_var((string) $aceptacion['email'], FILTER_VALIDATE_EMAIL)
    || !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', (string) $aceptacion['fecha_aceptacion_utc'])
) {
    responder(404, ['exito' => false, 'mensaje' => 'No encontramos una aceptación pendiente de reenvío para este teléfono.']);
}

$_SESSION['reenvio_correo_ultimo_intento'][$idCliente] = time();
$nombre = trim((string) $aceptacion['nombre']);
$correoEnviado = enviarCorreoAceptacion([
    'nombre' => $nombre,
    'apellido' => '',
    'email' => (string) $aceptacion['email']
], (string) $aceptacion['fecha_aceptacion_utc']);

if (!$correoEnviado) {
    responder(502, [
        'exito' => false,
        'mensaje' => 'No se pudo enviar el correo. Revisa la configuración Gmail del servidor e inténtalo nuevamente.'
    ]);
}

responder(200, [
    'exito' => true,
    'mensaje' => 'Correo de aceptación reenviado correctamente.',
    'correoEnviado' => true
]);
