<?php
declare(strict_types=1);

const VERSION_TERMINOS = '2026-10-20-v1';

function obtenerImagenTerminos(string $nombreArchivo): string
{
    $ruta = __DIR__ . '/assets/' . $nombreArchivo;
    if (!is_file($ruta) || !is_readable($ruta)) {
        throw new RuntimeException('No se encuentra un logo requerido para el documento.');
    }

    return 'data:image/jpeg;base64,' . base64_encode((string) file_get_contents($ruta));
}

function obtenerContenidoTerminosHtml(): string
{
    $logoValencia = obtenerImagenTerminos('hotel-valencia.jpg');
    $logoInnHub = obtenerImagenTerminos('innhub.jpg');
    $versionTerminos = VERSION_TERMINOS;

    return <<<HTML
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 92px 58px 68px; }
    body { color: #28332c; font-family: DejaVu Sans, sans-serif; font-size: 10px; line-height: 1.55; }
    .brand { background: #466b4f; border-radius: 8px; margin-bottom: 20px; padding: 15px 20px; text-align: center; }
    .brand img { height: 58px; margin: 0 16px; object-fit: contain; vertical-align: middle; }
    h1 { color: #294a32; font-size: 21px; margin: 0 0 5px; text-align: center; }
    .version { color: #65736a; font-size: 9px; margin: 0 0 22px; text-align: center; }
    h2 { border-bottom: 1px solid #d8e0d9; color: #355c3d; font-size: 12px; margin: 17px 0 6px; padding-bottom: 3px; }
    p { margin: 0 0 7px; text-align: justify; }
    ul { margin: 3px 0 8px; padding-left: 18px; }
    li { margin-bottom: 4px; }
    .notice { background: #f3f6f2; border-left: 3px solid #c79b3b; margin-top: 17px; padding: 9px 11px; }
    .footer { color: #68756b; font-size: 8px; margin-top: 24px; text-align: center; }
  </style>
</head>
<body>
  <div class="brand">
    <img src="{$logoValencia}" alt="Hotel Valencia">
    <img src="{$logoInnHub}" alt="InnHub">
  </div>
  <h1>Términos y condiciones de hospedaje</h1>
  <p class="version">Hotel Valencia · Versión {$versionTerminos} · Vigentes desde el 20 de octubre de 2026</p>

  <p>Estos términos regulan las solicitudes de reserva y la estadía en el establecimiento identificado comercialmente como Hotel Valencia. La plataforma InnHub facilita la gestión digital de la solicitud. Al marcar la casilla de aceptación, el titular declara haber leído y aceptado esta versión. La aceptación queda registrada cuando se verifica el teléfono asociado a la solicitud.</p>

  <h2>1. Solicitud y confirmación de la reserva</h2>
  <p>Una solicitud enviada por la plataforma no garantiza por sí sola una habitación. La reserva queda confirmada cuando el hotel comunica expresamente su aceptación, disponibilidad, fechas, ocupación, precio final y condiciones de pago. El huésped debe revisar esa confirmación y comunicar oportunamente cualquier error. Cambios de fechas, habitación u ocupación dependen de disponibilidad y pueden modificar el precio; no se aplicarán cargos adicionales sin informar su valor previamente.</p>

  <h2>2. Tarifas, pagos e impuestos</h2>
  <p>Los valores se presentan en pesos colombianos (COP), salvo que se indique otra moneda. Antes de confirmar o cobrar, se informará el precio total aplicable a las fechas y personas seleccionadas, así como los impuestos, cargos y servicios adicionales que correspondan. Se aceptan los medios de pago que el hotel ofrezca y comunique para cada reserva. Si se solicita anticipo o garantía, su valor, fecha límite, finalidad y reglas de devolución deberán informarse antes del pago.</p>

  <h2>3. Llegada, salida e identificación</h2>
  <p>Los horarios de entrada y salida se indicarán en la confirmación de cada reserva. El ingreso anticipado, la salida tardía y las noches adicionales están sujetos a disponibilidad y solo tendrán costo si este se comunica y acepta previamente. Al llegar, el titular y los acompañantes deberán proporcionar la información de identificación y registro exigida por la normativa aplicable. La persona titular responde por la exactitud de los datos de su solicitud y por informar cualquier cambio relevante.</p>

  <h2>4. Cancelaciones, modificaciones y no presentación</h2>
  <ul>
    <li>La cancelación recibida al menos 48 horas antes de la hora de llegada indicada en la confirmación no tendrá penalidad. Los anticipos pagados se reembolsarán íntegramente por el medio original, dentro de los plazos legales aplicables.</li>
    <li>Para cancelaciones recibidas con menos de 48 horas de anticipación o cuando el huésped no se presente en la fecha acordada, podrá cobrarse como penalidad el valor de una noche, sin exceder el valor efectivamente pagado o garantizado para ese concepto.</li>
    <li>Las solicitudes de cambio se atenderán según disponibilidad y precio vigente. El hotel informará cualquier diferencia antes de aplicar el cambio.</li>
    <li>Si el hotel no puede prestar el servicio confirmado por una causa atribuible al establecimiento, informará al huésped y ofrecerá una alternativa equivalente sin costo adicional o el reembolso de los valores pagados por el servicio no prestado, según corresponda y sin limitar los derechos legales del consumidor.</li>
  </ul>

  <h2>5. Convivencia y cuidado de las instalaciones</h2>
  <p>El huésped y sus acompañantes deben respetar a las demás personas, las instrucciones razonables del personal y las normas de seguridad. No se permiten actividades ilícitas, fiestas o conductas que perturben gravemente el descanso. Se prohíbe fumar dentro de habitaciones y espacios interiores cerrados. Las visitas y personas no incluidas en el registro requieren autorización del hotel. El huésped debe usar con cuidado muebles, equipos y demás instalaciones, y reportar de inmediato daños o riesgos.</p>
  <p>El huésped será responsable únicamente por daños directos que se acrediten como causados por él o sus acompañantes, excluyendo el desgaste normal. El hotel comunicará el daño y su costo razonable, sustentado en reparación o reposición; no se impondrán cobros automáticos o no informados.</p>

  <h2>6. Menores de edad y acompañantes</h2>
  <p>Los menores deben estar acompañados por su madre, padre, representante legal o adulto debidamente autorizado, y cumplir los requisitos de identificación y protección establecidos por la ley. El adulto responsable debe supervisar a los menores durante la estadía. El titular de la reserva debe registrar a todas las personas que se hospedarán.</p>

  <h2>7. Seguridad, pertenencias y atención de solicitudes</h2>
  <p>El huésped debe mantener bajo cuidado sus objetos personales y utilizar las medidas de seguridad que el establecimiento ponga a su disposición. Esto no excluye las responsabilidades que legalmente correspondan al hotel. Las novedades, solicitudes especiales o inconformidades deben comunicarse al personal tan pronto como sea posible para permitir su atención.</p>

  <h2>8. Tratamiento de datos personales</h2>
  <p>Los datos suministrados se utilizan para gestionar la solicitud y prestación del hospedaje, verificar el contacto, mantener comunicaciones relacionadas con el servicio y atender obligaciones legales. Se conservarán durante el tiempo necesario para esos fines y de acuerdo con la normativa aplicable. El titular puede solicitar consulta, actualización, corrección o supresión, cuando proceda, mediante los canales oficiales de atención del Hotel Valencia publicados por el establecimiento. La aceptación de estos términos no reemplaza las autorizaciones específicas que la ley exija para otros usos de datos.</p>

  <h2>9. Fuerza mayor y alcance de las condiciones</h2>
  <p>Ante hechos imprevisibles o irresistibles que impidan prestar el servicio, las partes procurarán una solución razonable, como reprogramación o devolución de valores por servicios no prestados, conforme a la ley. Ninguna cláusula limita derechos irrenunciables del huésped, la protección al consumidor, ni la responsabilidad que no pueda excluirse legalmente. Si una disposición resulta inaplicable, las demás conservarán su validez.</p>

  <h2>10. Normativa y consultas</h2>
  <p>Estas condiciones se interpretan conforme a las leyes de la República de Colombia y a las normas de protección al consumidor y de turismo que resulten aplicables. Para consultas, cambios o reclamos, el huésped puede comunicarse por los canales oficiales publicados por el Hotel Valencia. Prevalecerán las normas imperativas sobre cualquier estipulación de este documento.</p>

  <div class="notice"><strong>Constancia de aceptación.</strong> La aceptación electrónica se asocia al nombre, correo y teléfono proporcionados por el huésped y al registro de verificación del código enviado a ese teléfono. La plataforma remitirá una copia de esta versión al correo informado.</div>
  <p class="footer">Hotel Valencia · Gestión digital con InnHub · Documento de términos y condiciones · {$versionTerminos}</p>
</body>
</html>
HTML;
}
