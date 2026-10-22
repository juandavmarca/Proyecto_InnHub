<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . '/terminos_contenido.php';

function configuracionCorreo(): array
{
    $archivoEnv = __DIR__ . '/.env';
    $configuracion = [];
    if (is_file($archivoEnv)) {
        if (!is_readable($archivoEnv)) {
            throw new RuntimeException('No se puede leer la configuración SMTP.');
        }

        foreach (file($archivoEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
            $linea = trim($linea);
            if ($linea === '' || str_starts_with($linea, '#')) {
                continue;
            }
            $partes = explode('=', $linea, 2);
            if (count($partes) === 2) {
                $configuracion[trim($partes[0])] = trim(trim($partes[1]), "\"'");
            }
        }
    }

    $claves = [
        'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE',
        'MAIL_FROM', 'MAIL_FROM_NAME', 'APP_PUBLIC_URL'
    ];
    foreach ($claves as $clave) {
        $valorEntorno = getenv($clave);
        if ($valorEntorno !== false) {
            $configuracion[$clave] = $valorEntorno;
        }
    }

    foreach (['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] as $requerida) {
        if (trim((string) ($configuracion[$requerida] ?? '')) === '') {
            throw new RuntimeException('Faltan SMTP_USER o SMTP_PASS en la configuración del correo.');
        }
    }

    $configuracion['SMTP_PORT'] = (int) ($configuracion['SMTP_PORT'] ?? 587);
    $configuracion['SMTP_SECURE'] = strtolower(trim((string) ($configuracion['SMTP_SECURE'] ?? 'tls')));
    $configuracion['MAIL_FROM'] = trim((string) ($configuracion['MAIL_FROM'] ?? ''));
    if ($configuracion['MAIL_FROM'] === '') {
        $configuracion['MAIL_FROM'] = $configuracion['SMTP_USER'];
    }
    $configuracion['MAIL_FROM_NAME'] = trim((string) ($configuracion['MAIL_FROM_NAME'] ?? ''));
    if ($configuracion['MAIL_FROM_NAME'] === '') {
        $configuracion['MAIL_FROM_NAME'] = 'Hotel Valencia - InnHub';
    }
    if ($configuracion['SMTP_PORT'] < 1 || !in_array($configuracion['SMTP_SECURE'], ['tls', 'ssl'], true)) {
        throw new RuntimeException('La configuración SMTP tiene un puerto o cifrado inválido.');
    }

    $configuracion['SMTP_PASS'] = preg_replace('/\s+/', '', trim($configuracion['SMTP_PASS']));

    return $configuracion;
}

function enviarCorreoAceptacion(array $cliente, string $fechaAceptacion): bool
{
    try {
        $configuracion = configuracionCorreo();
        $autoload = __DIR__ . '/vendor/autoload.php';
        if (!is_file($autoload)) {
            throw new RuntimeException('Faltan las dependencias de correo y generación de PDF.');
        }
        require_once $autoload;

        $fecha = new DateTimeImmutable($fechaAceptacion, new DateTimeZone('UTC'));
        $fechaLocal = $fecha->setTimezone(new DateTimeZone('America/Bogota'));
        $nombre = trim($cliente['nombre'] . ' ' . $cliente['apellido']);
        $nombreSeguro = htmlspecialchars($nombre, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $correoSeguro = htmlspecialchars($cliente['email'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $fechaSegura = $fechaLocal->format('d/m/Y H:i') . ' (hora de Colombia)';
        $urlBase = rtrim((string) ($configuracion['APP_PUBLIC_URL'] ?? ''), '/');
        $enlaceHtml = $urlBase !== ''
            ? '<p style="text-align:center;margin:24px 0"><a href="'
                . htmlspecialchars($urlBase . '/terminos.php?descargar=1', ENT_QUOTES, 'UTF-8')
                . '" style="display:inline-block;background:#466b4f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Descargar términos y condiciones</a></p>'
            : '';
        $versionTerminos = VERSION_TERMINOS;

        $mensaje = new PHPMailer(true);
        $mensaje->isSMTP();
        $mensaje->Host = $configuracion['SMTP_HOST'];
        $mensaje->SMTPAuth = true;
        $mensaje->Username = $configuracion['SMTP_USER'];
        $mensaje->Password = $configuracion['SMTP_PASS'];
        $mensaje->Port = $configuracion['SMTP_PORT'];
        $mensaje->Timeout = 20;
        $mensaje->SMTPSecure = $configuracion['SMTP_SECURE'] === 'ssl'
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $caFile = trim((string) ($configuracion['SMTP_CA_FILE'] ?? ''));
        if ($caFile !== '') {
            if (!is_file($caFile) || !is_readable($caFile)) {
                throw new RuntimeException('El certificado CA configurado no está disponible o no se puede leer.');
            }
            $mensaje->SMTPOptions = [
                'ssl' => [
                    'cafile' => $caFile,
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                    'allow_self_signed' => false
                ]
            ];
        }
        $mensaje->CharSet = PHPMailer::CHARSET_UTF8;
        $mensaje->setFrom(
            $configuracion['MAIL_FROM'],
            $configuracion['MAIL_FROM_NAME'] ?? 'Hotel Valencia - InnHub'
        );
        $mensaje->addAddress($cliente['email'], $nombre);
        $mensaje->addEmbeddedImage(__DIR__ . '/assets/hotel-valencia.png', 'logo-valencia', 'hotel-valencia.png');
        $mensaje->addEmbeddedImage(__DIR__ . '/assets/innhub.png', 'logo-innhub', 'innhub.png');
        $mensaje->Subject = 'Confirmación de aceptación de términos - Hotel Valencia';
        $mensaje->isHTML(true);
        $mensaje->Body = <<<HTML
<!doctype html>
<html lang="es">
<body style="margin:0;background:#f3f5f3;color:#26332a;font-family:Arial,sans-serif">
  <div style="max-width:640px;margin:32px auto;background:#fff;border:1px solid #e1e7e1;border-radius:12px;overflow:hidden">
    <div style="background:#466b4f;text-align:center;padding:18px">
      <img src="cid:logo-valencia" alt="Hotel Valencia" style="display:inline-block;height:76px;max-width:42%;width:auto;vertical-align:middle">
      <img src="cid:logo-innhub" alt="InnHub" style="display:inline-block;height:76px;max-width:42%;width:auto;vertical-align:middle">
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;color:#647267;font-size:13px;letter-spacing:1px;text-transform:uppercase">Constancia de aceptación</p>
      <h1 style="margin:0 0 18px;color:#294a32;font-size:25px">Gracias, {$nombreSeguro}</h1>
      <p style="font-size:16px;line-height:1.65">Confirmamos que aceptaste los términos y condiciones de hospedaje del Hotel Valencia al verificar el código enviado a tu teléfono.</p>
      <div style="margin:22px 0;padding:16px 18px;background:#f3f6f2;border-left:4px solid #c79b3b">
        <p style="margin:0 0 7px"><strong>Nombre:</strong> {$nombreSeguro}</p>
        <p style="margin:0 0 7px"><strong>Correo registrado:</strong> {$correoSeguro}</p>
        <p style="margin:0 0 7px"><strong>Fecha de aceptación:</strong> {$fechaSegura}</p>
        <p style="margin:0"><strong>Versión:</strong> {$versionTerminos}</p>
      </div>
      <p style="font-size:15px;line-height:1.6">Adjuntamos una copia en PDF para que puedas conservarla y consultarla cuando lo necesites.</p>
      {$enlaceHtml}
      <p style="margin-top:26px;color:#647267;font-size:13px;line-height:1.6">Este mensaje confirma únicamente la aceptación de los términos. La reserva queda sujeta a la confirmación de disponibilidad y condiciones enviadas por el hotel.</p>
      <p style="margin:24px 0 0;color:#294a32;font-weight:bold">Atentamente,<br>Hotel Valencia · InnHub</p>
    </div>
    <div style="padding:14px 24px;background:#f6f8f6;color:#758078;font-size:12px;text-align:center">Conserva este correo como constancia de tu aceptación.</div>
  </div>
</body>
</html>
HTML;
        $mensaje->AltBody = "Hola {$nombre}, confirmamos que aceptaste los términos y condiciones del Hotel Valencia el {$fechaSegura}. Adjuntamos el documento PDF. Versión {$versionTerminos}.";

        $opciones = new Dompdf\Options();
        $opciones->set('isRemoteEnabled', false);
        $opciones->set('chroot', __DIR__);
        $pdf = new Dompdf\Dompdf($opciones);
        $pdf->loadHtml(obtenerContenidoTerminosHtml(), 'UTF-8');
        $pdf->setPaper('A4');
        $pdf->render();
        $mensaje->addStringAttachment(
            $pdf->output(),
            'terminos-condiciones-hotel-valencia.pdf',
            PHPMailer::ENCODING_BASE64,
            'application/pdf'
        );
        $mensaje->send();
        return true;
    } catch (PHPMailer\PHPMailer\Exception | Dompdf\Exception | RuntimeException | DateTimeException $error) {
        error_log('No se pudo enviar la confirmación de aceptación: ' . $error->getMessage());
        return false;
    }
}
