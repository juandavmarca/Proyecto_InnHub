<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../Verificacion/correo_aceptacion.php';
require_once __DIR__ . '/../config/database.php';

function buscarCuentaRecuperacion(string $correo): ?array
{
    global $pdo;

    $stmt = $pdo->prepare(
        "SELECT u.id_usuario, u.documento, u.email, u.estado, u.rol, e.cargo,
                e.estado AS estado_empleado, e.email AS email_empleado
         FROM usuarios u
         LEFT JOIN empleados e ON e.documento = u.documento
         WHERE LOWER(u.email) = LOWER(:email_usuario)
            OR LOWER(e.email) = LOWER(:email_empleado)
         LIMIT 1"
    );
    $stmt->execute([
        ':email_usuario' => $correo,
        ':email_empleado' => $correo
    ]);
    $cuenta = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$cuenta) {
        return null;
    }

    $rolCuenta = strtolower(trim((string) $cuenta['rol']));
    $rol = $rolCuenta === 'empleado'
        ? strtolower(trim((string) ($cuenta['cargo'] ?? '')))
        : $rolCuenta;
    $estadoActivo = strtolower(trim((string) $cuenta['estado'])) === 'activo';
    $empleadoActivo = $rolCuenta !== 'empleado'
        || strtolower(trim((string) ($cuenta['estado_empleado'] ?? ''))) === 'activo';

    if (
        !$estadoActivo
        || !$empleadoActivo
        || !in_array($rol, ['administrador', 'recepcionista'], true)
    ) {
        return null;
    }

    $cuenta['rol_resuelto'] = $rol;
    $cuenta['correo_recuperacion'] = trim((string) ($cuenta['email_empleado'] ?: $cuenta['email']));
    return $cuenta;
}

function enviarCodigoRecuperacionCorreo(string $correo, string $codigo): bool
{
    try {
        $configuracion = configuracionCorreo();
        $autoload = __DIR__ . '/../Verificacion/vendor/autoload.php';
        if (!is_file($autoload)) {
            throw new RuntimeException('Faltan las dependencias de correo para recuperar contraseñas.');
        }
        require_once $autoload;

        $correoSeguro = htmlspecialchars($correo, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
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
        $mensaje->CharSet = PHPMailer\PHPMailer\PHPMailer::CHARSET_UTF8;
        $mensaje->setFrom(
            $configuracion['MAIL_FROM'],
            $configuracion['MAIL_FROM_NAME']
        );
        $mensaje->addAddress($correo);
        $mensaje->isHTML(true);
        $mensaje->Subject = 'Código para recuperar tu contraseña - Hotel Valencia';
        $mensaje->Body = <<<HTML
<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f3f5f3;color:#26332a;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:20px auto;padding:32px;background:#fff;border:1px solid #e1e7e1;border-radius:12px">
    <p style="color:#8a6a22;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">Hotel Valencia · InnHub</p>
    <h1 style="color:#294a32;font-size:23px">Recupera tu contraseña</h1>
    <p style="font-size:15px;line-height:1.6">Usa este código para crear una nueva contraseña:</p>
    <p style="margin:24px 0;padding:18px;background:#f8f5eb;border-radius:8px;color:#7a5913;font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center">{$codigo}</p>
    <p style="font-size:14px;line-height:1.6">El código vence en 5 minutos y solo se puede utilizar una vez. Si no solicitaste recuperar tu contraseña, ignora este correo.</p>
    <p style="color:#647267;font-size:12px">Solicitud asociada al correo {$correoSeguro}.</p>
  </div>
</body>
</html>
HTML;
        $mensaje->AltBody = "Tu código para recuperar tu contraseña de Hotel Valencia - InnHub es {$codigo}. Vence en 5 minutos y solo se puede usar una vez. Si no solicitaste este código, ignora este correo.";
        $mensaje->send();
        return true;
    } catch (PHPMailer\PHPMailer\Exception | RuntimeException $error) {
        error_log('No se pudo enviar el código de recuperación por correo: ' . $error->getMessage());
        return false;
    }
}
