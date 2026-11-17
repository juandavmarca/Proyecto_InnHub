<?php
declare(strict_types=1);

function cargarEntornoInnHub(): void
{
    static $cargado = false;
    if ($cargado) {
        return;
    }
    $cargado = true;

    $rutaConfigurada = trim((string) (getenv('INNHUB_ENV_PATH') ?: ''));
    $archivoEnv = $rutaConfigurada !== ''
        ? $rutaConfigurada
        : dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . '.env';

    if (!is_file($archivoEnv)) {
        if ($rutaConfigurada !== '') {
            throw new RuntimeException('El archivo indicado por INNHUB_ENV_PATH no existe.');
        }
        return;
    }

    if (!is_readable($archivoEnv)) {
        throw new RuntimeException('No se puede leer el archivo de configuración privado.');
    }

    $lineas = file($archivoEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lineas === false) {
        throw new RuntimeException('No se pudo cargar el archivo de configuración privado.');
    }

    foreach ($lineas as $linea) {
        $linea = trim($linea);
        if ($linea === '' || str_starts_with($linea, '#')) {
            continue;
        }

        $partes = explode('=', $linea, 2);
        if (count($partes) !== 2) {
            continue;
        }

        $clave = trim($partes[0]);
        if (!preg_match('/^[A-Z][A-Z0-9_]*$/', $clave) || getenv($clave) !== false) {
            continue;
        }

        $valor = trim(trim($partes[1]), "\"'");
        putenv($clave . '=' . $valor);
    }
}
