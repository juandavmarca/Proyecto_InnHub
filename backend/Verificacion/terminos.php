<?php
declare(strict_types=1);

require_once __DIR__ . '/terminos_contenido.php';

$autoload = __DIR__ . '/vendor/autoload.php';
if (!is_file($autoload)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'El documento no está disponible temporalmente.';
    exit;
}

require_once $autoload;

try {
    $options = new Dompdf\Options();
    $options->set('isRemoteEnabled', false);
    $options->set('chroot', __DIR__);
    $pdf = new Dompdf\Dompdf($options);
    $pdf->loadHtml(obtenerContenidoTerminosHtml(), 'UTF-8');
    $pdf->setPaper('A4');
    $pdf->render();
    $pdf->stream(
        'terminos-condiciones-hotel-valencia.pdf',
        ['Attachment' => isset($_GET['descargar'])]
    );
} catch (Throwable $error) {
    error_log('No se pudo generar el PDF de términos del Hotel Valencia: ' . $error->getMessage());
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'No se pudo generar el documento en este momento.';
}
