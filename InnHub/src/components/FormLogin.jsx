import { NavLink } from "react-router-dom";

const logo = "http://localhost/ERPInnHub/backend/uploads/logo.png";

export function FormLogin() {

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
          <div className="login-header">
            <h2>Bienvenido <strong>de nuevo</strong></h2>
            <p>Inicia sesión para continuar</p>
          </div>

          <form className="login-form" onSubmit={(e) => e.preventDefault()}>
            <div className="login-field">
              <label htmlFor="email">Usuario</label>
              <div className="login-input-wrap">
                <i className="fas fa-user" aria-hidden="true"></i>
                <input id="email" type="email" placeholder="Ingresa tu usuario" />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <div className="login-input-wrap">
                <i className="fas fa-lock" aria-hidden="true"></i>
                <input id="password" type="password" placeholder="Ingresa tu contraseña" />
                <i className="fas fa-eye-slash login-password-icon" aria-hidden="true"></i>
              </div>
            </div>

            <div className="login-row">
              <span></span>
              <button type="button" className="link-button">¿Olvidaste tu contraseña?</button>
            </div>

            <NavLink to="/dashboard" className="login-button">Iniciar sesión</NavLink>
          </form>
        </section>
      </div>
    </div>
  );
}

export default FormLogin;