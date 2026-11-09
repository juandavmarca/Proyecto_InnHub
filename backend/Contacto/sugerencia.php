<?php
declare(strict_types=1);

require_once __DIR__ . '/../Verificacion/common.php';
require_once __DIR__ . '/../Verificacion/correo_aceptacion.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['exito' => false, 'mensaje' => 'Método no permitido.']);
}

$datos = leerEntrada();
$email = $datos['email'] ?? null;
$descripcion = $datos['descripcion'] ?? null;

if (!is_string($email) || strlen($email) > 254 || !filter_var(trim($email), FILTER_VALIDATE_EMAIL)) {
    responder(422, ['exito' => false, 'mensaje' => 'Ingresa un correo electrónico válido.']);
}

$email = trim($email);
$descripcion = is_string($descripcion) ? trim($descripcion) : '';
if ($descripcion === '' || strlen($descripcion) > 8000 || preg_match('//u', $descripcion) !== 1) {
    responder(422, ['exito' => false, 'mensaje' => 'Escribe una descripción válida de hasta 2000 caracteres.']);
}

$caracteres = preg_match_all('/./us', $descripcion);
if ($caracteres === false || $caracteres > 2000) {
    responder(422, ['exito' => false, 'mensaje' => 'La descripción no puede superar los 2000 caracteres.']);
}

$ahora = time();
$ultimoEnvio = $_SESSION['ultima_sugerencia_atencion'] ?? 0;
if (is_int($ultimoEnvio) && $ahora - $ultimoEnvio < 30) {
    responder(429, ['exito' => false, 'mensaje' => 'Espera un momento antes de enviar otra sugerencia.']);
}
$_SESSION['ultima_sugerencia_atencion'] = $ahora;

try {
    $configuracion = configuracionCorreo();
    $autoload = __DIR__ . '/../Verificacion/vendor/autoload.php';
    if (!is_file($autoload)) {
        throw new RuntimeException('Faltan las dependencias de correo.');
    }
    require_once $autoload;

    $mensaje = new PHPMailer\PHPMailer\PHPMailer(true);
    $mensaje->isSMTP();
    $mensaje->Host = $configuracion['SMTP_HOST'];
    $mensaje->SMTPAuth = true;
    $mensaje->Username = $configuracion['SMTP_USER'];
    $mensaje->Password = $configuracion['SMTP_PASS'];
    $mensaje->Port = $configuracion['SMTP_PORT'];
    $mensaje->Timeout = 20;
    $mensaje->SMTPSecure = $configuracion['SMTP_SECURE'] === 'ssl'
        ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $caFile = trim((string) ($configuracion['SMTP_CA_FILE'] ?? ''));
    if ($caFile !== '') {
        if (!is_file($caFile) || !is_readable($caFile)) {
            throw new RuntimeException('El certificado CA configurado no está disponible.');
        }
        $mensaje->SMTPOptions = [
            'ssl' => [
                'cafile' => $caFile,
                'verify_peer' => true,
                'verify_peer_name' => true,
                'allow_self_signed' => false,
            ],
        ];
    }
    $mensaje->CharSet = PHPMailer\PHPMailer\PHPMailer::CHARSET_UTF8;
    $mensaje->setFrom(
        $configuracion['MAIL_FROM'],
        $configuracion['MAIL_FROM_NAME'] ?? 'Hotel Valencia - InnHub'
    );
    $mensaje->addAddress('juandavmarca345@gmail.com');
    $mensaje->addReplyTo($email);
    $mensaje->Subject = 'Nueva sugerencia de Atención 24/7 - Hotel Valencia';
    $mensaje->isHTML(false);
    $mensaje->Body = "Correo de contacto: {$email}\n\nDescripción:\n{$descripcion}";
    $mensaje->send();

    responder(200, ['exito' => true, 'mensaje' => 'Tu sugerencia fue enviada correctamente.']);
} catch (Throwable $error) {
    error_log('No se pudo enviar una sugerencia de Atención 24/7: ' . $error->getMessage());
    responder(500, [
        'exito' => false,
        'mensaje' => 'No se pudo enviar tu sugerencia en este momento. Inténtalo más tarde.',
    ]);
}
