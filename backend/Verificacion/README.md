# Confirmación de aceptación de términos

## Configuración privada en Hostinger

1. En Hostinger, crea un archivo `.env` fuera de `public_html`, por ejemplo en la carpeta `domains/innhub.site/`. No lo subas a Git ni lo guardes dentro de la carpeta pública.
2. Usa `backend/Verificacion/.env.example` como plantilla y copia sus variables al archivo privado. Por defecto, el backend lo busca un nivel por encima de la carpeta del sitio. Si lo guardas en otra ruta, configura la variable de servidor `INNHUB_ENV_PATH` con la ruta absoluta al archivo.
3. Completa `DB_HOST`, `DB_NAME`, `DB_USER` y `DB_PASS` con los datos actuales de MySQL en Hostinger; `WUAPI_ACCOUNT_ID` y `WUAPI_API_KEY` con los datos vigentes de la cuenta Waupi conectada; `SMTP_USER`/`SMTP_PASS` con las credenciales de un buzón remitente real; y las variables `WOMPI_*` con las credenciales del comercio.
4. La plantilla usa el SMTP de Hostinger (`smtp.hostinger.com`, puerto `465`, cifrado `ssl`). Si usarás Gmail, configura el host `smtp.gmail.com`, puerto `587`, cifrado `tls` y una contraseña de aplicación de Google. `MAIL_FROM` puede quedar vacío para usar `SMTP_USER`; `SMTP_CA_FILE` solo se necesita si el servidor requiere un certificado CA personalizado.
5. Confirma que PHP tenga habilitadas las extensiones PDO MySQL y cURL, y que el hosting permita conexiones salientes HTTPS y SMTP.

Las solicitudes de códigos de teléfono y los correos de confirmación/recuperación usan estas variables compartidas. Las variables definidas directamente en el servidor tienen prioridad sobre el archivo. Si faltan credenciales o el proveedor las rechaza, el backend devuelve un error y registra detalles técnicos sin exponer claves.

## Wompi en producción

En el Dashboard de comercios de Wompi, activa el ambiente de producción y copia en el `.env` privado la llave pública `pub_prod_...`, el secreto de integridad y el secreto de eventos. Configura `WOMPI_ENVIRONMENT=prod` y `WOMPI_REDIRECT_URL=https://innhub.site/`; no compartas ni subas los secretos a Git.

Configura en la sección de eventos del ambiente de producción esta URL:
`https://innhub.site/backend/Pagos/webhook.php`

Wompi debe notificar el evento `transaction.updated`. El webhook valida la firma y el monto antes de guardar el estado del pago y actualizar la reserva a `Pago aprobado` o `Pago rechazado`. El navegador no confirma por sí solo un pago.

Antes de habilitar pagos reales, confirma que la migración `backend/migrations/20261106_reservas_pagos_wompi.sql` ya se ejecutó en la base de producción; ejecútala solo si aún no está aplicada. Usa credenciales `test` únicamente con el ambiente sandbox de Wompi y credenciales `prod` para cobros reales.

## Instalación y publicación

Instala las dependencias PHP de esta carpeta con `composer install` y ejecuta la migración `backend/migrations/20261020_aceptacion_terminos.sql` en la base de datos configurada. `APP_PUBLIC_URL` debe apuntar a `https://innhub.site/backend/Verificacion` para que el botón de descarga del correo funcione.

Para desarrollo local, puedes definir `INNHUB_ENV_PATH` con la ruta a un `.env` fuera de la raíz pública local. No guardes credenciales reales en el repositorio.

La versión inicial `2026-10-20-v1` incluye reglas propuestas de cancelación (48 horas), convivencia, daños, identificación y privacidad. Antes de publicar estas condiciones, confirma que las reglas, canales de atención e información del responsable del tratamiento sean correctos y solicita revisión jurídica local.
