# React + Vite

## Verificación por WhatsApp con Waupi

La reserva solicita un código OTP mediante `backend/Verificacion/solicitar.php` y lo valida con `backend/Verificacion/verificar.php`. El navegador solo se comunica con PHP; la clave de Waupi nunca se incluye en React.

Para desarrollo local, crea `backend/Verificacion/.env` a partir de `.env.example` e indica el ID de cuenta de Waupi y su API key. El archivo `.env` está excluido de Git y protegido por `.htaccess`. También se pueden configurar `WUAPI_ACCOUNT_ID` y `WUAPI_API_KEY` como variables de entorno del servidor.

El código de cuatro dígitos se envía automáticamente al pasar a la verificación, vence a los tres minutos y permite hasta cinco intentos. Se requiere que PHP tenga habilitada la extensión cURL y que el frontend se ejecute desde `http://localhost:5173` o `http://127.0.0.1:5173`.

### Tarifas de reserva

La tarifa por noche depende de la cantidad de huéspedes: 1 persona $65.000 COP; 2 personas $120.000 COP; 3 personas $175.000 COP; 4 personas $230.000 COP; 5 personas $285.000 COP; 6 personas $340.000 COP. El total se calcula multiplicando la tarifa por la cantidad de noches.

### Clientes sin documento

Al verificar correctamente el OTP, PHP guarda o actualiza los datos del huésped en `clientes`. El documento, el tipo de documento y la ciudad de residencia quedan en `NULL` hasta que se completen posteriormente. Para ello, aplica una sola vez `backend/migrations/20261007_clientes_documento_opcional.sql`, que agrega `id_cliente` como identificador interno y conserva la relación de `reservas` con ese identificador. Haz una copia de seguridad de `innhub` antes de aplicar la migración.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
