<?php
declare(strict_types=1);

$archivoEnvWompi = __DIR__ . '/.env';
if (is_file($archivoEnvWompi)) {
    if (!is_readable($archivoEnvWompi)) {
        error_log('No se puede leer la configuración local de Wompi.');
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['exito' => false, 'mensaje' => 'No se pudo leer la configuración de pagos.']);
        exit;
    }

    foreach (file($archivoEnvWompi, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
        $linea = trim($linea);
        if ($linea === '' || str_starts_with($linea, '#')) {
            continue;
        }
        $partes = explode('=', $linea, 2);
        if (count($partes) === 2) {
            $clave = trim($partes[0]);
            $valor = trim(trim($partes[1]), "\"'");
            if (getenv($clave) === false) {
                putenv($clave . '=' . $valor);
            }
        }
    }
}

require_once __DIR__ . '/../Verificacion/common.php';
require_once __DIR__ . '/../config/database.php';

function cargarConfiguracionWompi(): array
{
    $configuracion = [
        'ambiente' => trim((string) (getenv('WOMPI_ENVIRONMENT') ?: '')),
        'llavePublica' => trim((string) (getenv('WOMPI_PUBLIC_KEY') ?: '')),
        'secretoIntegridad' => trim((string) (getenv('WOMPI_INTEGRITY_SECRET') ?: '')),
        'secretoEventos' => trim((string) (getenv('WOMPI_EVENTS_SECRET') ?: '')),
        'urlRetorno' => trim((string) (getenv('WOMPI_REDIRECT_URL') ?: '')),
    ];

    foreach ($configuracion as $valor) {
        if ($valor === '' || stripos($valor, 'REEMPLAZAR') !== false) {
            error_log('Falta una variable requerida para la integración de Wompi.');
            responder(500, [
                'exito' => false,
                'mensaje' => 'Configura las credenciales de prueba de Wompi en backend/Pagos/.env.'
            ]);
        }
    }

    $prefijoEsperado = $configuracion['ambiente'] === 'test' ? 'pub_test_' : 'pub_prod_';
    if (
        !in_array($configuracion['ambiente'], ['test', 'prod'], true)
        || !str_starts_with($configuracion['llavePublica'], $prefijoEsperado)
    ) {
        error_log('El ambiente de Wompi no coincide con la llave pública configurada.');
        responder(500, [
            'exito' => false,
            'mensaje' => 'La configuración de la pasarela no es válida. Comunícate con el hotel.'
        ]);
    }

    return $configuracion;
}

function crearFirmaIntegridad(string $referencia, int $montoCentavos, string $expiracion, string $secreto): string
{
    return hash('sha256', $referencia . $montoCentavos . 'COP' . $expiracion . $secreto);
}
