<?php
declare(strict_types=1);

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
                'mensaje' => 'Configura las variables WOMPI_* en el archivo privado de InnHub.'
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

    $partesUrlRetorno = parse_url($configuracion['urlRetorno']);
    $esquemaUrlRetorno = strtolower((string) ($partesUrlRetorno['scheme'] ?? ''));
    $hostUrlRetorno = strtolower(trim((string) ($partesUrlRetorno['host'] ?? ''), '[]'));
    if (
        !is_array($partesUrlRetorno)
        || !in_array($esquemaUrlRetorno, ['http', 'https'], true)
        || $hostUrlRetorno === ''
        || (
            $configuracion['ambiente'] === 'prod'
            && (
                $esquemaUrlRetorno !== 'https'
                || in_array($hostUrlRetorno, ['localhost', '127.0.0.1', '::1'], true)
            )
        )
    ) {
        error_log('La URL de retorno de Wompi no es válida para el ambiente configurado.');
        responder(500, [
            'exito' => false,
            'mensaje' => 'Configura WOMPI_REDIRECT_URL con una URL HTTPS pública para producción.'
        ]);
    }

    return $configuracion;
}

function crearFirmaIntegridad(string $referencia, int $montoCentavos, string $expiracion, string $secreto): string
{
    return hash('sha256', $referencia . $montoCentavos . 'COP' . $expiracion . $secreto);
}
