<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../config/database.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderAuth(405, ['success' => false, 'message' => 'Método no permitido']);
}

if (empty($_SESSION['id_usuario'])) {
    responderAuth(401, ['success' => false, 'message' => 'Inicia sesión para actualizar tu perfil']);
}

$nombre = trim((string) ($_POST['nombre'] ?? ''));
$apellido = trim((string) ($_POST['apellido'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$telefono = trim((string) ($_POST['telefono'] ?? ''));

if ($nombre === '' || $apellido === '' || $email === '') {
    responderAuth(400, ['success' => false, 'message' => 'Nombre, apellido y correo son obligatorios']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 45) {
    responderAuth(400, ['success' => false, 'message' => 'Ingresa un correo válido de máximo 45 caracteres']);
}

if (strlen($telefono) > 10) {
    responderAuth(400, ['success' => false, 'message' => 'El teléfono no puede superar 10 caracteres']);
}

try {
    $fotoNueva = null;
    $archivoSubido = null;
    $upload = $_FILES['foto_perfil'] ?? null;

if ($upload !== null) {
    if ($upload['error'] !== UPLOAD_ERR_OK) {
        responderAuth(400, ['success' => false, 'message' => 'No se pudo recibir la foto. Inténtalo nuevamente.']);
    }

    if ($upload['size'] <= 0 || $upload['size'] > 5 * 1024 * 1024) {
        responderAuth(400, ['success' => false, 'message' => 'La foto debe pesar máximo 5 MB']);
    }

    $tiposPermitidos = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp'
    ];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $tipo = $finfo->file($upload['tmp_name']);

    if (!isset($tiposPermitidos[$tipo]) || @getimagesize($upload['tmp_name']) === false) {
        responderAuth(400, ['success' => false, 'message' => 'La foto debe ser JPG, PNG o WebP válida']);
    }

    $directorio = __DIR__ . '/../uploads/';
    if (!is_dir($directorio) && !mkdir($directorio, 0755, true) && !is_dir($directorio)) {
        error_log('No se pudo crear el directorio de fotos de perfil.');
        responderAuth(500, ['success' => false, 'message' => 'No se pudo guardar la foto']);
    }

    $nombreArchivo = 'perfil_' . bin2hex(random_bytes(16)) . '.' . $tiposPermitidos[$tipo];
    $archivoSubido = $directorio . $nombreArchivo;

    if (!move_uploaded_file($upload['tmp_name'], $archivoSubido)) {
        error_log('No se pudo mover el archivo de foto de perfil.');
        responderAuth(500, ['success' => false, 'message' => 'No se pudo guardar la foto']);
    }

    $fotoNueva = 'http://localhost/ERPInnHub/backend/uploads/' . $nombreArchivo;
}

    $stmt = $pdo->prepare(
        "SELECT u.documento, u.estado, u.rol, e.documento AS empleado_documento
         FROM usuarios u
         LEFT JOIN empleados e ON e.documento = u.documento
         WHERE u.id_usuario = :id_usuario
         LIMIT 1"
    );
    $stmt->execute([':id_usuario' => $_SESSION['id_usuario']]);
    $cuenta = $stmt->fetch(PDO::FETCH_ASSOC);

    if (
        !$cuenta
        || strtolower(trim((string) $cuenta['estado'])) !== 'activo'
        || !in_array(strtolower(trim((string) $cuenta['rol'])), ['administrador', 'recepcionista'], true)
    ) {
        $_SESSION = [];
        session_destroy();
        if ($archivoSubido !== null && is_file($archivoSubido)) {
            unlink($archivoSubido);
        }
        responderAuth(401, ['success' => false, 'message' => 'La sesión ya no tiene acceso al panel']);
    }

    if (empty($cuenta['empleado_documento'])) {
        if ($archivoSubido !== null && is_file($archivoSubido)) {
            unlink($archivoSubido);
        }
        responderAuth(409, ['success' => false, 'message' => 'No se encontró el empleado asociado a esta cuenta']);
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        "UPDATE empleados
         SET nombre = :nombre, apellido = :apellido, email = :email, telefono = :telefono,
             foto_perifl = COALESCE(:foto_perifl, foto_perifl)
         WHERE documento = :documento"
    );
    $stmt->execute([
        ':nombre' => $nombre,
        ':apellido' => $apellido,
        ':email' => $email,
        ':telefono' => $telefono,
        ':foto_perifl' => $fotoNueva,
        ':documento' => $cuenta['documento']
    ]);

    $stmt = $pdo->prepare("UPDATE usuarios SET email = :email WHERE id_usuario = :id_usuario");
    $stmt->execute([
        ':email' => $email,
        ':id_usuario' => $_SESSION['id_usuario']
    ]);

    $stmt = $pdo->prepare(
        "SELECT u.documento, u.email, u.rol, e.nombre, e.apellido, e.cargo, e.telefono, e.foto_perifl
         FROM usuarios u
         LEFT JOIN empleados e ON e.documento = u.documento
         WHERE u.id_usuario = :id_usuario
         LIMIT 1"
    );
    $stmt->execute([':id_usuario' => $_SESSION['id_usuario']]);
    $perfil = $stmt->fetch(PDO::FETCH_ASSOC);

    $pdo->commit();

    responderAuth(200, [
        'success' => true,
        'message' => 'Perfil actualizado correctamente',
        'usuario' => [
            'documento' => $perfil['documento'],
            'email' => $perfil['email'],
            'rol' => $perfil['rol'],
            'nombre' => $perfil['nombre'] ?? '',
            'apellido' => $perfil['apellido'] ?? '',
            'cargo' => $perfil['cargo'] ?? $perfil['rol'],
            'telefono' => $perfil['telefono'] ?? '',
            'foto_perfil' => $perfil['foto_perifl'] ?? ''
        ]
    ]);
} catch (PDOException $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($archivoSubido !== null && is_file($archivoSubido)) {
        unlink($archivoSubido);
    }

    error_log('Error al actualizar perfil: ' . $error->getMessage());
    responderAuth(500, ['success' => false, 'message' => 'No se pudo actualizar el perfil. Inténtalo de nuevo.']);
} catch (Exception $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($archivoSubido !== null && is_file($archivoSubido)) {
        unlink($archivoSubido);
    }

    error_log('Error al procesar actualización del perfil: ' . $error->getMessage());
    responderAuth(500, ['success' => false, 'message' => 'No se pudo actualizar el perfil. Inténtalo de nuevo.']);
}
