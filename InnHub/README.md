# React + Vite

## Sugerencias de Atención 24/7

Al seleccionar la tarjeta **Atención 24/7** en la página principal, el visitante puede enviar su correo y una descripción. El backend envía la sugerencia a `juandavmarca345@gmail.com` mediante PHPMailer y la configuración SMTP existente en `backend/Verificacion/.env`; el correo del visitante se agrega como dirección de respuesta. El destinatario se fija en el servidor y no puede modificarse desde el formulario.

## Verificación por WhatsApp con Waupi

La reserva solicita un código OTP mediante `backend/Verificacion/solicitar.php` y lo valida con `backend/Verificacion/verificar.php`. El navegador solo se comunica con PHP; la clave de Waupi nunca se incluye en React.

Para desarrollo local, crea `backend/Verificacion/.env` a partir de `.env.example` e indica el ID de cuenta de Waupi y su API key. El archivo `.env` está excluido de Git y protegido por `.htaccess`. También se pueden configurar `WUAPI_ACCOUNT_ID` y `WUAPI_API_KEY` como variables de entorno del servidor.

El código de cuatro dígitos se envía automáticamente al pasar a la verificación, vence a los tres minutos y permite hasta cinco intentos. Se requiere que PHP tenga habilitada la extensión cURL y que el frontend se ejecute desde `http://localhost:5173` o `http://127.0.0.1:5173`.

### Tarifas de reserva

La tarifa por noche depende de la cantidad de huéspedes: 1 persona $65.000 COP; 2 personas $120.000 COP; 3 personas $175.000 COP; 4 personas $230.000 COP; 5 personas $285.000 COP; 6 personas $340.000 COP. El total se calcula multiplicando la tarifa por la cantidad de noches.

### Clientes sin documento

Al verificar correctamente el OTP, PHP guarda o actualiza los datos del huésped en `clientes`. El documento, el tipo de documento y la ciudad de residencia quedan en `NULL` hasta que se completen posteriormente. Para ello, aplica una sola vez `backend/migrations/20261007_clientes_documento_opcional.sql`, que agrega `id_cliente` como identificador interno y conserva la relación de `reservas` con ese identificador. Haz una copia de seguridad de `innhub` antes de aplicar la migración.

## Pagos de reservas con Wompi

El flujo es: completar los datos, verificar el código de WhatsApp, elegir entre pagar el 50% o el total de la estadía y continuar al checkout seguro de Wompi. El saldo del pago parcial se paga en el hotel al llegar. El servidor calcula los importes, crea una reserva y un pago pendientes, y cambia el estado de la reserva a `Pago aprobado` o `Pago rechazado` únicamente al recibir un webhook válido de Wompi; la redirección al sitio no confirma el pago.

El checkout recibe prellenados el nombre, correo y teléfono verificados del huésped. No solicitamos ni almacenamos su documento de identidad durante la reserva, así que si Wompi lo requiere, el huésped deberá ingresarlo en su checkout.

Antes de probar, haz una copia de seguridad de `innhub` y aplica `backend/migrations/20261106_reservas_pagos_wompi.sql`. Esta migración permite reservas en línea sin un empleado asignado, guarda el total cotizado y deja vacía la fecha de pago mientras Wompi no haya aprobado la transacción.

Crea `backend/Pagos/.env` copiando `backend/Pagos/.env.example` y configura las credenciales de **prueba** del Dashboard de Wompi. En este modo Wompi usa su ambiente sandbox y no realiza cobros reales:

- `WOMPI_ENVIRONMENT=test`
- `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET` del ambiente de pruebas.
- `WOMPI_REDIRECT_URL` con `http://localhost:5173/` mientras trabajes en local.
- `APP_FRONTEND_ORIGIN` en `backend/Verificacion/.env` (o como variable de entorno del servidor), con el origen exacto del frontend, sin ruta ni barra final.

El archivo de configuración está excluido de Git y protegido por `.htaccess`. No incluyas llaves ni secretos en React, repositorios ni mensajes. Wompi rechaza el `redirect-url` que apunta a `localhost`, por eso el checkout lo omite durante el desarrollo local. Para habilitar el botón de regreso de Wompi y probar el retorno, expón temporalmente el frontend y el backend mediante un túnel HTTPS y configura la URL pública de la página principal del frontend en `WOMPI_REDIRECT_URL`; al volver, InnHub consulta el estado y muestra un resultado con el botón **Volver al comercio**. Registra también la URL pública del backend terminada en `/ERPInnHub/backend/Pagos/webhook.php` como webhook para el evento `transaction.updated`. Sin un túnel o servidor público el checkout de pruebas puede abrir, pero el pago quedará pendiente hasta recibir el webhook. El webhook valida el checksum SHA-256 con `WOMPI_EVENTS_SECRET`, referencia, moneda y monto antes de cambiar el estado de la reserva.

Primero completa el recorrido con llaves de prueba y revisa que Wompi pueda alcanzar el webhook desde Internet. No cambies a producción hasta tener un dominio/servidor con HTTPS y el webhook público permanente. Para ese cambio, reemplaza conjuntamente el ambiente, la llave pública, el secreto de integridad, el secreto de eventos y las URL públicas; usa `WOMPI_ENVIRONMENT=prod` y llaves `pub_prod_`. La guía oficial está en [Widget & Checkout Web de Wompi](https://docs.wompi.co/docs/colombia/widget-checkout-web/) y [Eventos de Wompi](https://docs.wompi.co/docs/colombia/eventos/).

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
