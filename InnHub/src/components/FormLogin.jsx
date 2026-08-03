import { NavLink } from "react-router-dom";

const logo = "http://localhost/ERPInnHub/backend/uploads/logos.png";

export function FormLogin() {

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src={logo} alt="InnHub Logo" className="login-brand-logo" />
         
        </div>
        <div className="login-header">
          <h2>Bienvenido de nuevo</h2>
          <p>Inicia sesión  como empleado o administrador</p>
        </div>

        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          <div className="login-field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" placeholder="Correo electrónico" />
          </div>

          <div className="login-field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" placeholder="Contraseña" />
          </div>

          <div className="login-row">
            <label className="login-checkbox">
              <input type="checkbox" /> Recordar usuario
            </label>
            <button type="button" className="link-button">
              Olvidaste la contraseña?
            </button>
          </div>

          <NavLink to="/dashboard" className="login-button">
            Iniciar sesión
          </NavLink>
        </form>

        <div className="login-footer">
          <div className="login-socials">
            <button type="button" className="social-btn">F</button>
            <button type="button" className="social-btn">G</button>
            <button type="button" className="social-btn">T</button>
            <button type="button" className="social-btn">GH</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormLogin;