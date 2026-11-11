import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BASE_URL, cerrarSesion, obtenerSesion } from "../services/api";

const logo = `${BASE_URL}/uploads/logodash.png`;

function Sidebar() {
  const navigate = useNavigate();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [rol, setRol] = useState("");
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let active = true;

    obtenerSesion()
      .then((usuario) => {
        if (active) {
          setRol(String(usuario?.rol || "").trim().toLowerCase());
        }
      })
      .catch((error) => {
        if (active) {
          setSessionError(error.message || "No se pudo verificar el rol de la cuenta.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const esAdministrador = rol === "administrador";

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await cerrarSesion();
      setMenuMovilAbierto(false);
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(error.message || "No se pudo cerrar la sesión.");
    }
  };

  return (
    <>
    <button
      type="button"
      className="dashboard-menu-toggle"
      aria-label={menuMovilAbierto ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
      aria-expanded={menuMovilAbierto}
      aria-controls="dashboard-sidebar"
      onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
    >
      <i className={`fas ${menuMovilAbierto ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
    </button>
    {menuMovilAbierto && (
      <button
        type="button"
        className="dashboard-sidebar-backdrop"
        aria-label="Cerrar menú de navegación"
        onClick={() => setMenuMovilAbierto(false)}
      />
    )}
    <div id="dashboard-sidebar" className={`sidebar text-white ${menuMovilAbierto ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand">
        <img src={logo} alt="Logo del panel administrativo" className="sidebar-brand-logo" />
        <div className="sidebar-brand-content">
          {/* <span className="brand-name">Valencia</span> */}
          {/* <small className="brand-subtitle">Administración</small> */}
        </div>
      </div>

      <div className="nav-group">
        <div className="nav-group-title">Panel</div>
        <ul className="nav nav-pills flex-column gap-2">
          {esAdministrador && (
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : "text-white"}`
                }
                to="/dashboard"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <i className="fas fa-chart-line"></i>
                <span className="sidebar-label">Dashboard</span>
              </NavLink>
            </li>
          )}
          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : "text-white"}`
              }
              to="/Clientes"
              onClick={() => setMenuMovilAbierto(false)}
            >
              <i className="fas fa-users"></i>
              <span className="sidebar-label">Clientes</span>
            </NavLink>
          </li>

          {esAdministrador && (
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : "text-white"}`
                }
                to="/Empleados"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <i className="fas fa-user-tie"></i>
                <span className="sidebar-label">Empleados</span>
              </NavLink>
            </li>
          )}

          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : "text-white"}`
              }
              to="/reservas"
              onClick={() => setMenuMovilAbierto(false)}
            >
              <i className="fas fa-calendar-check"></i>
              <span className="sidebar-label">Reservas</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : "text-white"}`
              }
              to="/Habitaciones"
              onClick={() => setMenuMovilAbierto(false)}
            >
              <i className="fas fa-bed"></i>
              <span className="sidebar-label">Habitaciones</span>
            </NavLink>
          </li>
          {esAdministrador && (
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : "text-white"}`
                }
                to="/Deshabilitados"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <i className="fas fa-gear"></i>
                <span className="sidebar-label">Deshabilitados</span>
              </NavLink>
            </li>
          )}
        </ul>
      </div>

      <div className="sidebar-footer">
        {sessionError && <small className="sidebar-logout-error" role="alert">{sessionError}</small>}
        {logoutError && <small className="sidebar-logout-error" role="alert">{logoutError}</small>}
        <button type="button" className="nav-link sidebar-action sidebar-logout" onClick={handleLogout}>
          <i className="fas fa-right-from-bracket"></i>
          <span className="sidebar-label">Cerrar sesión</span>
        </button>
      </div>
    </div>
    </>
  );
}

export default Sidebar;