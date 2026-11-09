<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../config/database.php';

function normalizarTelefonoReserva(string $telefono): string
{
    return preg_replace('/\D+/', '', $telefono) ?? '';
}

function buscarClientesConReservas(string $telefono): array
{
    global $pdo;

    $digitos = normalizarTelefonoReserva($telefono);
    $telefonos = [$digitos];

    if (str_starts_with($digitos, '57') && strlen($digitos) === 12) {
        $telefonos[] = substr($digitos, 2);
    } elseif (strlen($digitos) === 10) {
        $telefonos[] = '57' . $digitos;
    }

    $expresionTelefono = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        c.telefono, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', ''), '/', '')";
    $stmt = $pdo->prepare(
        "SELECT DISTINCT c.id_cliente
         FROM clientes c
         INNER JOIN reservas r ON r.id_cliente = c.id_cliente
         WHERE {$expresionTelefono} IN (:telefono_1, :telefono_2)"
    );
    $stmt->execute([
        ':telefono_1' => $telefonos[0],
        ':telefono_2' => $telefonos[1] ?? $telefonos[0]
    ]);

    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function enviarCodigoReservaWhatsapp(string $telefono, string $codigo): void
{
    [$accountId, $apiKey] = cargarConfiguracionWuapi();
    if (!function_exists('curl_init')) {
        error_log('La extensión cURL no está habilitada en PHP.');
        responder(500, ['exito' => false, 'mensaje' => 'El servidor no puede enviar códigos por WhatsApp en este momento.']);
    }

    $payload = [
        'accountId' => $accountId,
        'to' => $telefono,
        'type' => 'text',
        'text' => "Tu código para consultar tus reservas en Hotel Valencia es: {$codigo}. Válido por 3 minutos."
    ];
    $ch = curl_init('https://api.wuapi.dev/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
            'Idempotency-Key: ' . bin2hex(random_bytes(16))
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE)
    ]);

    $respuesta = curl_exec($ch);
    $errorCurl = curl_error($ch);
    $codigoHttp = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($respuesta === false || $codigoHttp < 200 || $codigoHttp >= 300) {
        error_log($respuesta === false
            ? 'Error de conexión con Waupi al enviar código de consulta: ' . $errorCurl
            : 'Waupi rechazó el código de consulta. HTTP ' . $codigoHttp);
        responder(502, [
            'exito' => false,
            'mensaje' => 'No se pudo enviar el código por WhatsApp. Inténtalo nuevamente más tarde.'
        ]);
    }
}
