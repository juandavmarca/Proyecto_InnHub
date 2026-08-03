import { useEffect, useState } from "react";
import {
  obtenerClientes,
  obtenerEmpleados,
  obtenerHabitaciones,
} from "../services/api";

const obtenerEstadoDeshabilitado = (item) =>
  item.deshabilitado ??
  Boolean(item.estado && String(item.estado).toLowerCase().includes("deshabil"));

const habitacionDisponible = (habitacion) => {
  const estado = String(habitacion.estado || "").toLowerCase();
  if (!estado) return false;
  if (estado.includes("no disponible") || estado.includes("ocupada") || estado.includes("reservada") || estado.includes("mantenimiento")) {
    return false;
  }
  return estado.includes("disponible") || estado.includes("libre");
};

const getHabitacionStatus = (habitacion) => {
  const estado = String(habitacion.estado || "").toLowerCase();
  if (estado.includes("no disponible")) return "no-disponible";
  if (estado.includes("ocupada")) return "ocupada";
  if (estado.includes("mantenimiento")) return "mantenimiento";
  if (estado.includes("disponible") || estado.includes("libre")) return "disponible";
  return "sin-estado";
};

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState("clientes");

  useEffect(() => {
    Promise.all([
      obtenerClientes(),
      obtenerEmpleados(),
      obtenerHabitaciones(),
    ])
      .then(([clientesData, empleadosData, habitacionesData]) => {
        const clientes = clientesData.map((cliente) => ({
          ...cliente,
          deshabilitado: obtenerEstadoDeshabilitado(cliente),
        }));
        const empleados = empleadosData.map((empleado) => ({
          ...empleado,
          deshabilitado: obtenerEstadoDeshabilitado(empleado),
        }));
        const habitaciones = habitacionesData.map((habitacion) => ({
          ...habitacion,
          disponible: habitacionDisponible(habitacion),
          statusCategory: getHabitacionStatus(habitacion),
        }));

        setStats({
          totalClientes: clientes.length,
          clientesDeshabilitados: clientes.filter((cliente) => cliente.deshabilitado).length,
          totalEmpleados: empleados.length,
          empleadosDeshabilitados: empleados.filter((empleado) => empleado.deshabilitado).length,
          habitacionesDisponibles: habitaciones.filter((habitacion) => habitacion.statusCategory === "disponible").length,
          habitacionesNoDisponibles: habitaciones.filter((habitacion) => habitacion.statusCategory === "no-disponible").length,
          habitacionesOcupadas: habitaciones.filter((habitacion) => habitacion.statusCategory === "ocupada").length,
          habitacionesMantenimiento: habitaciones.filter((habitacion) => habitacion.statusCategory === "mantenimiento").length,
        });
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar las estadísticas. Intenta recargar la página.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted mb-0">
            Vista general de las estadísticas del panel administrativo con los clientes,
            empleados y habitaciones.
          </p>
        </div>
      </div>

      {loading && (
        <div className="alert alert-info">Cargando estadísticas...</div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && stats && (
        <>
          <div className="dashboard-tabs mb-4">
            <button
              type="button"
              className={`dashboard-tab-btn ${selectedSection === "clientes" ? "active" : ""}`}
              onClick={() => setSelectedSection("clientes")}
            >
              Clientes
            </button>
            <button
              type="button"
              className={`dashboard-tab-btn ${selectedSection === "empleados" ? "active" : ""}`}
              onClick={() => setSelectedSection("empleados")}
            >
              Empleados
            </button>
            <button
              type="button"
              className={`dashboard-tab-btn ${selectedSection === "habitaciones" ? "active" : ""}`}
              onClick={() => setSelectedSection("habitaciones")}
            >
              Habitaciones
            </button>
          </div>

          {selectedSection === "clientes" && (
            <section className="dashboard-section mb-5">
              <div className="section-header">
                <h2>Clientes</h2>
                <p className="text-muted mb-4">
                  Control y métricas de clientes registrados y clientes inactivos.
                </p>
              </div>
              <div className="dashboard-grid">
                <article className="dashboard-card primary">
                  <div className="card-head">
                    <span className="dashboard-card-icon">
                      <i className="fas fa-users"></i>
                    </span>
                    <div>
                      <span className="dashboard-card-label">Clientes registrados</span>
                      <div className="dashboard-card-value">{stats.totalClientes}</div>
                    </div>
                  </div>
                  <p className="dashboard-card-subtitle">
                    Total de clientes con registro en el sistema.
                  </p>
                  
                </article>

                <article className="dashboard-card success">
                  <div className="card-head">
                    <span className="dashboard-card-icon">
                      <i className="fas fa-user-slash"></i>
                    </span>
                    <div>
                      <span className="dashboard-card-label">Clientes deshabilitados</span>
                      <div className="dashboard-card-value">{stats.clientesDeshabilitados}</div>
                    </div>
                  </div>
                  <p className="dashboard-card-subtitle">
                    Clientes marcados como inactivos o con estado deshabilitado.
                  </p>
                  
                </article>
              </div>
            </section>
          )}

          {selectedSection === "empleados" && (
            <section className="dashboard-section mb-5">
              <div className="section-header">
                <h2>Empleados</h2>
                <p className="text-muted mb-4">
                  Seguimiento de empleados activos y empleados deshabilitados.
                </p>
              </div>
              <div className="dashboard-grid">
                <article className="dashboard-card info">
                  <div className="card-head">
                    <span className="dashboard-card-icon">
                      <i className="fas fa-user-tie"></i>
                    </span>
                    <div>
                      <span className="dashboard-card-label">Empleados activos</span>
                      <div className="dashboard-card-value">{stats.totalEmpleados - stats.empleadosDeshabilitados}</div>
                    </div>
                  </div>
                  <p className="dashboard-card-subtitle">
                    Empleados registrados que actualmente están activos.
                  </p>
                 
                </article>

                <article className="dashboard-card warning">
                  <div className="card-head">
                    <span className="dashboard-card-icon">
                      <i className="fas fa-user-lock"></i>
                    </span>
                    <div>
                      <span className="dashboard-card-label">Empleados deshabilitados</span>
                      <div className="dashboard-card-value">{stats.empleadosDeshabilitados}</div>
                    </div>
                  </div>
                  <p className="dashboard-card-subtitle">
                    Total de empleados actualmente deshabilitados o inactivos.
                  </p>
                 
                </article>
              </div>
            </section>
          )}

          {selectedSection === "habitaciones" && (
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Habitaciones</h2>
                <p className="text-muted mb-4">
                  Control de disponibilidad de habitaciones para un mejor control.
                </p>
              </div>
              <div className="dashboard-grid">
                <article className="dashboard-card success">
                  <div className="card-head">
                    <span className="dashboard-card-icon">
                      <i className="fas fa-door-open"></i>
                    </span>
                    <div>
                      <span className="dashboard-card-label">Disponibles</span>
                      <div className="dashboard-card-value">{stats.habitacionesDisponibles}</div>
                    </div>
                  </div>
                  <p className="dashboard-card-subtitle">
                    Habitaciones libres y listas para reserva.
                  </p>
                  <div className="dashboard-card-footer">Disponibilidad inmediata en el hotel.</div>
                </article>

                <article className="dashboard-card secondary">
                  <div className="card-head">
                    <span className="dashboard-card-icon">
                      <i className="fas fa-door-closed"></i>
                    </span>
                    <div>
                      <span className="dashboard-card-label">No disponibles</span>
                      <div className="dashboard-card-value">{stats.habitacionesNoDisponibles}</div>
                    </div>
                  </div>
                  <p className="dashboard-card-subtitle">
                    Habitaciones que están bloqueadas o fuera de servicio.
                  </p>
                  <div className="dashboard-card-footer">Verifica por qué no están disponibles.</div>
                </article>

                <article className="dashboard-card danger">
                  <div className="card-head">
                    <span className="dashboard-card-icon">
                      <i className="fas fa-bed"></i>
                    </span>
                    <div>
                      <span className="dashboard-card-label">Ocupadas</span>
                      <div className="dashboard-card-value">{stats.habitacionesOcupadas}</div>
                    </div>
                  </div>
                  <p className="dashboard-card-subtitle">
                    Habitaciones que actualmente tienen huéspedes.
                  </p>
                  <div className="dashboard-card-footer">Monitorea la ocupación en tiempo real.</div>
                </article>

                <article className="dashboard-card warning">
                  <div className="card-head">
                    <span className="dashboard-card-icon">
                      <i className="fas fa-tools"></i>
                    </span>
                    <div>
                      <span className="dashboard-card-label">Mantenimiento</span>
                      <div className="dashboard-card-value">{stats.habitacionesMantenimiento}</div>
                    </div>
                  </div>
                  <p className="dashboard-card-subtitle">
                    Habitaciones en proceso de revisión o limpieza.
                  </p>
                  <div className="dashboard-card-footer">Asegura la calidad antes de liberar la habitación.</div>
                </article>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
