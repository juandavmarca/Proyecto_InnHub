import { NavLink, useNavigate } from "react-router-dom";

const logo = "http://localhost/ERPInnHub/backend/uploads/logodash.png";

function Sidebar() {
  const navigate = useNavigate();

  return (
    <div className="sidebar text-white">
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
          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : "text-white"}`
              }
              to="/dashboard"
            >
              <i className="fas fa-chart-line"></i>
              <span className="sidebar-label">Dashboard</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : "text-white"}`
              }
              to="/Clientes"
            >
              <i className="fas fa-users"></i>
              <span className="sidebar-label">Clientes</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : "text-white"}`
              }
              to="/Empleados"
            >
              <i className="fas fa-user-tie"></i>
              <span className="sidebar-label">Empleados</span>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : "text-white"}`
              }
              to="/Habitaciones"
            >
              <i className="fas fa-bed"></i>
              <span className="sidebar-label">Habitaciones</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : "text-white"}`
              }
              to="/Deshabilitados"
            >
              <i className="fas fa-gear"></i>
              <span className="sidebar-label">Deshabilitados</span>
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="sidebar-footer">
        <button type="button" className="nav-link sidebar-action sidebar-logout" onClick={() => navigate("/login")}>
          <i className="fas fa-right-from-bracket"></i>
          <span className="sidebar-label">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;