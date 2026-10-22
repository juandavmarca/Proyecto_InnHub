# Confirmación de aceptación de términos

## Preparación local

1. Ejecuta la migración `backend/migrations/20261020_aceptacion_terminos.sql` en la base de datos `innhub`.
2. Desde esta carpeta, instala las dependencias PHP con `composer install`.
3. Conserva el `.env` existente y agrega allí las variables de SMTP de `.env.example`. No reemplaces las credenciales de WhatsApp.
4. Para Gmail, activa la verificación en dos pasos y crea una contraseña de aplicación desde la seguridad de la cuenta Google. Configura `SMTP_USER` con el correo remitente y `SMTP_PASS` con esa contraseña de aplicación (no con la contraseña normal de Gmail). Si Google muestra la clave separada por espacios, puedes pegarla así: el servidor quitará esos espacios al autenticar. Ya están preconfigurados `SMTP_HOST=smtp.gmail.com`, puerto `587` y TLS. `MAIL_FROM` puede quedar vacío: se usará `SMTP_USER`. `SMTP_CA_FILE` solo es necesario en equipos con inspección TLS local; en una instalación normal se deja vacío. `APP_PUBLIC_URL` debe ser la URL pública de esta carpeta para que el botón de descarga del correo funcione.
5. Abre `terminos.php` en el navegador para revisar y descargar el PDF.

El envío usa SMTP autenticado con cifrado TLS/SSL. Si falta la configuración o el proveedor rechaza el envío, la verificación del teléfono se conserva y la interfaz informa que el correo no pudo enviarse; el servidor registra el error.

## Contenido y publicación

La versión inicial `2026-10-20-v1` incluye reglas propuestas de cancelación (48 horas), convivencia, daños, identificación y privacidad. Antes de publicar el sitio o aplicar estas condiciones a huéspedes, el Hotel Valencia debe confirmar que esas reglas, sus canales oficiales de atención y la información del responsable del tratamiento de datos sean correctos, y solicitar revisión jurídica local. Cada modificación sustancial debe publicarse como una nueva versión.
