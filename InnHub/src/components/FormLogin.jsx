import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CenteredToast from "./CenteredToast";
import {
  BASE_URL,
  confirmarRecuperacionPassword,
  iniciarSesion,
  solicitarRecuperacionPassword,
} from "../services/api";

const logo = `${BASE_URL}/uploads/logo.png`;

export function FormLogin() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [inicioExitoso, setInicioExitoso] = useState(false);
  const [destino, setDestino] = useState("/dashboard");
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [pasoRecuperacion, setPasoRecuperacion] = useState("solicitar");
  const [correoRecuperacion, setCorreoRecuperacion] = useState("");
  const [codigoRecuperacion, setCodigoRecuperacion] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [errorRecuperacion, setErrorRecuperacion] = useState("");
  const [cargandoRecuperacion, setCargandoRecuperacion] = useState(false);

  const abrirRecuperacion = () => {
    setCorreoRecuperacion(usuario.includes("@") ? usuario.trim() : "");
    setPasoRecuperacion("solicitar");
    setCodigoRecuperacion("");
    setPasswordNueva("");
    setConfirmarPassword("");
    setErrorRecuperacion("");
    setMostrarRecuperacion(true);
  };

  const solicitarCodigoRecuperacion = async (event) => {
    event.preventDefault();
    setErrorRecuperacion("");
    setCargandoRecuperacion(true);

    try {
      await solicitarRecuperacionPassword(correoRecuperacion.trim());
      setPasoRecuperacion("confirmar");
    } catch (recoveryError) {
      setErrorRecuperacion(recoveryError.message || "No se pudo procesar la solicitud.");
    } finally {
      setCargandoRecuperacion(false);
    }
  };

  const confirmarRecuperacion = async (event) => {
    event.preventDefault();
    setErrorRecuperacion("");

    if (passwordNueva.length < 8) {
      setErrorRecuperacion("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (passwordNueva !== confirmarPassword) {
      setErrorRecuperacion("Las contraseñas no coinciden.");
      return;
    }

    setCargandoRecuperacion(true);
    try {
      await confirmarRecuperacionPassword(
        correoRecuperacion.trim(),
        codigoRecuperacion.trim(),
        passwordNueva
      );
      setPasoRecuperacion("completada");
      setPassword("");
    } catch (recoveryError) {
      setErrorRecuperacion(recoveryError.message || "No se pudo actualizar la contraseña.");
    } finally {
      setCargandoRecuperacion(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setCargando(true);

    try {
      const cuenta = await iniciarSesion(usuario.trim(), password);
      const siguientePagina = String(cuenta?.rol || "").trim().toLowerCase() === "recepcionista"
        ? "/reservas"
        : "/dashboard";
      setDestino(siguientePagina);
      setInicioExitoso(true);
    } catch (loginError) {
      setError(loginError.message || "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <section className="login-visual" aria-label="Hotel Valencia">
          <div className="login-visual-content">
            <img src={logo} alt="Hotel Valencia Logo" className="login-brand-logo" />
            <div className="login-stars" aria-label="Hotel de cinco estrellas">★ ★ ★ ★ ★</div>
            <div className="login-quote">
              <span></span>
              <p>&quot;Tu hogar lejos de casa,<br />nuestra tradición de servir.&quot;</p>
              <span></span>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <Link className="login-home-link" to="/">
            <i className="fas fa-arrow-left" aria-hidden="true"></i>
            Volver al inicio
          </Link>
          <div className="login-header">
            <h2>Bienvenido <strong>de nuevo</strong></h2>
            <p>Inicia sesión para continuar</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">Usuario</label>
              <div className="login-input-wrap">
                <i className="fas fa-user" aria-hidden="true"></i>
                <input
                  id="email"
                  name="usuario"
                  type="text"
                  placeholder="Correo o documento"
                  autoComplete="username"
                  value={usuario}
                  onChange={(event) => setUsuario(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <div className="login-input-wrap">
                <i className="fas fa-lock" aria-hidden="true"></i>
                <input
                  id="password"
                  name="password"
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={mostrarPassword}
                  onClick={() => setMostrarPassword((mostrar) => !mostrar)}
                >
                  <i className={`fas ${mostrarPassword ? "fa-eye" : "fa-eye-slash"}`} aria-hidden="true"></i>
                </button>
              </div>
            </div>

            {error && <div className="login-error" role="alert">{error}</div>}

            <div className="login-row">
              <span></span>
              <span className="login-admin-note">Acceso para administradores y personal de recepción. En el primer ingreso, la contraseña es el documento.</span>
            </div>

            <button type="submit" className="login-button" disabled={cargando || inicioExitoso}>
              {cargando ? "Verificando..." : "Iniciar sesión"}
            </button>
            <button type="button" className="login-recovery-link" onClick={abrirRecuperacion}>
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        </section>
      </div>
      {mostrarRecuperacion && (
        <div
          className="password-recovery-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cargandoRecuperacion) {
              setMostrarRecuperacion(false);
            }
          }}
        >
          <section
            className="password-recovery-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-recovery-title"
          >
            <button
              type="button"
              className="password-recovery-close"
              aria-label="Cerrar recuperación de contraseña"
              disabled={cargandoRecuperacion}
              onClick={() => setMostrarRecuperacion(false)}
            >
              ×
            </button>
            <div className="password-recovery-icon" aria-hidden="true">
              <i className={`fas ${pasoRecuperacion === "completada" ? "fa-check" : "fa-key"}`} />
            </div>
            <span className="password-recovery-eyebrow">Acceso seguro · Hotel Valencia</span>
            <h2 id="password-recovery-title">
              {pasoRecuperacion === "completada" ? "¡Contraseña actualizada!" : "Recuperar contraseña"}
            </h2>
            {pasoRecuperacion === "solicitar" && (
              <form className="password-recovery-form" onSubmit={solicitarCodigoRecuperacion}>
                <p>Ingresa el correo electrónico registrado en tu cuenta. Te enviaremos allí un código de verificación.</p>
                <label htmlFor="recovery-email">Correo electrónico</label>
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  value={correoRecuperacion}
                  onChange={(event) => setCorreoRecuperacion(event.target.value)}
                  required
                  maxLength={100}
                  disabled={cargandoRecuperacion}
                />
                {errorRecuperacion && <p className="password-recovery-error" role="alert">{errorRecuperacion}</p>}
                <button type="submit" disabled={cargandoRecuperacion}>
                  {cargandoRecuperacion ? "Enviando…" : "Enviar código por correo"}
                </button>
              </form>
            )}
            {pasoRecuperacion === "confirmar" && (
              <form className="password-recovery-form" onSubmit={confirmarRecuperacion}>
                <p>Si la cuenta está activa, enviamos el código al correo registrado. Ingrésalo y crea una contraseña nueva.</p>
                <label htmlFor="recovery-code">Código de 6 dígitos</label>
                <input
                  id="recovery-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={codigoRecuperacion}
                  onChange={(event) => setCodigoRecuperacion(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  minLength={6}
                  maxLength={6}
                  disabled={cargandoRecuperacion}
                />
                <label htmlFor="recovery-new-password">Nueva contraseña</label>
                <input
                  id="recovery-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwordNueva}
                  onChange={(event) => setPasswordNueva(event.target.value)}
                  required
                  minLength={8}
                  disabled={cargandoRecuperacion}
                />
                <label htmlFor="recovery-confirm-password">Confirmar contraseña</label>
                <input
                  id="recovery-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmarPassword}
                  onChange={(event) => setConfirmarPassword(event.target.value)}
                  required
                  minLength={8}
                  disabled={cargandoRecuperacion}
                />
                {errorRecuperacion && <p className="password-recovery-error" role="alert">{errorRecuperacion}</p>}
                <button type="submit" disabled={cargandoRecuperacion || codigoRecuperacion.length !== 6}>
                  {cargandoRecuperacion ? "Actualizando…" : "Guardar nueva contraseña"}
                </button>
                <button
                  type="button"
                  className="password-recovery-secondary"
                  onClick={() => {
                    setPasoRecuperacion("solicitar");
                    setCodigoRecuperacion("");
                    setErrorRecuperacion("");
                  }}
                  disabled={cargandoRecuperacion}
                >
                  Usar otro correo
                </button>
              </form>
            )}
            {pasoRecuperacion === "completada" && (
              <div className="password-recovery-complete">
                <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
                <button type="button" onClick={() => setMostrarRecuperacion(false)}>
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      <CenteredToast
        show={inicioExitoso}
        message="¡Inicio de sesión correcto!"
        type="success"
        duration={1900}
        className="toast-login-success"
        onClose={() => navigate(destino, { replace: true })}
      />
    </div>
  );
}

export default FormLogin;