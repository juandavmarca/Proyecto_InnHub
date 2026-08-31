import { NavLink } from "react-router-dom";

function HabitacionCamas() {
  return (
    <div className="dashboard-page settings-page">
      <div className="dashboard-page-header settings-page-header">
        <div>
          <h1>Camas</h1>
          <p className="settings-subtitle">Gestión de camas por habitación</p>
        </div>
        <NavLink to="/Habitaciones" className="btn btn-secondary">
          Regresar a habitaciones
        </NavLink>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h2>Listado de camas</h2>
        </div>
        <div className="disabled-empty-state">
          Aquí podrás cargar y administrar las camas de cada habitación.
        </div>
      </div>
    </div>
  );
}

export default HabitacionCamas;
