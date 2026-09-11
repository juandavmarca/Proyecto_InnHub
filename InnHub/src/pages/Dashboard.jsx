import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerClientes,
  obtenerEmpleados,
  obtenerHabitaciones,
} from "../services/api";
import ClienteModal from "../components/ClienteModal";
import EmpleadoModal from "../components/EmpleadoModal";
import HabitacionModal from "../components/HabitacionModal";

const formatMoney = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);

const normalizeStatus = (value = "") => String(value).trim().toLowerCase();

const resolveStatus = (habitacion) => {
  const estado = normalizeStatus(habitacion.estado);

  if (!estado) return "sin-estado";
  if (estado.includes("ocupada")) return "ocupada";
  if (estado.includes("reservada")) return "reservada";
  if (estado.includes("mantenimiento")) return "mantenimiento";
  if (estado.includes("no disponible") || estado.includes("no_disponible")) return "no-disponible";
  if (estado.includes("disponible") || estado.includes("libre")) return "disponible";
  return "sin-estado";
};

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [habitacionEditar, setHabitacionEditar] = useState(null);
  const [empleadoEditar, setEmpleadoEditar] = useState(null);
  const [clienteEditar, setClienteEditar] = useState(null);

  useEffect(() => {
    Promise.all([
      obtenerClientes(),
      obtenerEmpleados(),
      obtenerHabitaciones(),
    ])
      .then(([clientesData, empleadosData, habitacionesData]) => {
        const clientes = Array.isArray(clientesData) ? clientesData : [];
        const empleados = Array.isArray(empleadosData) ? empleadosData : [];
        const habitaciones = Array.isArray(habitacionesData) ? habitacionesData : [];

        const totalHabitaciones = habitaciones.length;
        const ocupadas = habitaciones.filter((habitacion) => resolveStatus(habitacion) === "ocupada").length;
        const reservadas = habitaciones.filter((habitacion) => resolveStatus(habitacion) === "reservada").length;
        const mantenimiento = habitaciones.filter((habitacion) => resolveStatus(habitacion) === "mantenimiento").length;
        const noDisponibles = habitaciones.filter((habitacion) => resolveStatus(habitacion) === "no-disponible").length;
        const disponibles = habitaciones.filter((habitacion) => resolveStatus(habitacion) === "disponible").length;

        const occupancy = totalHabitaciones ? Math.round((ocupadas / totalHabitaciones) * 100) : 0;

        const employeeSummary = empleados.slice(0, 3).map((empleado) => {
          const nombreCompleto = [
            empleado.nombre,
            empleado.apellido,
            empleado.nombres,
            empleado.apellidos,
          ]
            .filter(Boolean)
            .join(" ") || "Empleado";
          const cargo = empleado.cargo || empleado.rol || empleado.puesto || "Sin cargo";
          const estado = normalizeStatus(empleado.estado || empleado.deshabilitado || "");

          return {
            initials: nombreCompleto
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((parte) => parte[0]?.toUpperCase() || "")
              .join("")
              .slice(0, 2) || "EM",
            nombre: nombreCompleto,
            tipo: cargo,
            estado: estado.includes("deshabil") || estado.includes("inactivo") ? "Inactivo" : "Activo",
          };
        });

        const customerSummary = clientes.slice(0, 3).map((cliente) => {
          const nombreCompleto = [
            cliente.nombre,
            cliente.apellido,
            cliente.nombres,
            cliente.apellidos,
          ]
            .filter(Boolean)
            .join(" ") || "Cliente";

          return {
            initials: nombreCompleto
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((parte) => parte[0]?.toUpperCase() || "")
              .join("")
              .slice(0, 2) || "CL",
            nombre: nombreCompleto,
            tipo: cliente.tipo || cliente.documento || "Cliente",
            estado: cliente.deshabilitado || normalizeStatus(cliente.estado || "").includes("deshabil") ? "Inactivo" : "Activo",
          };
        });

        setStats({
          totalHabitaciones,
          ocupadas,
          reservadas,
          mantenimiento,
          noDisponibles,
          disponibles,
          occupancy,
          totalClientes: clientes.length,
          totalEmpleados: empleados.length,
          empleadosDeshabilitados: empleados.filter((empleado) => {
            const estado = normalizeStatus(empleado.estado || empleado.deshabilitado || "");
            return estado.includes("deshabil") || estado.includes("inactivo");
          }).length,
          nextReservations: [],
          employeeSummary,
          customerSummary,
        });
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar las estadísticas. Intenta recargar la página.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Cargando estadísticas...</div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  const occupancyText = `${stats.occupancy}%`;
  const statusItems = [
    { label: "Ocupadas", value: stats.ocupadas, percent: stats.occupancy, accent: "gold" },
    { label: "Disponibles", value: stats.disponibles, percent: Math.max(0, Math.round((stats.disponibles / Math.max(stats.totalHabitaciones, 1)) * 100)), accent: "slate" },
    { label: "Mantenimiento", value: stats.mantenimiento, percent: stats.totalHabitaciones ? Math.round((stats.mantenimiento / stats.totalHabitaciones) * 100) : 0, accent: "sand" },
  ];

  return (
    <div className="dashboard-shell">
      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon"><i className="fa-solid fa-bed" /></div>
          <div className="stat-content">
            <span className="stat-label">Habitaciones totales</span>
            <strong>{stats.totalHabitaciones}</strong>
          </div>
          <div className="stat-arrow"><i className="fa-solid fa-chevron-right" /></div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><i className="fa-solid fa-users" /></div>
          <div className="stat-content">
            <span className="stat-label">Clientes totales</span>
            <strong>{stats.totalClientes}</strong>
          </div>
          <div className="stat-arrow"><i className="fa-solid fa-chevron-right" /></div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><i className="fa-solid fa-user-tie" /></div>
          <div className="stat-content">
            <span className="stat-label">Empleados totales</span>
            <strong>{stats.totalEmpleados}</strong>
          </div>
          <div className="stat-arrow"><i className="fa-solid fa-chevron-right" /></div>
        </article>

        <article className="stat-card">
          <div className="stat-icon"><i className="fa-solid fa-calendar-days" /></div>
          <div className="stat-content">
            <span className="stat-label">Reservas totales</span>
            <strong>--</strong>
          </div>
          <div className="stat-arrow"><i className="fa-solid fa-chevron-right" /></div>
        </article>
      </div>

      <div className="main-panels">
        <section className="panel occupancy-panel">
          <div className="panel-header">
            <h2>Ocupación del hotel</h2>
          </div>

          <div className="occupancy-content">
            <div
              className="donut-chart"
              style={{
                background: `conic-gradient(#d1a93a 0 ${stats.occupancy}%, #f0efe8 ${stats.occupancy}% 100%)`,
              }}
            >
              <div className="donut-center">
                <strong>{occupancyText}</strong>
                <span>Ocupación actual</span>
              </div>
            </div>

            <ul className="status-list">
              {statusItems.map((item) => (
                <li key={item.label}>
                  <span className={`legend-dot ${item.accent}`} />
                  <div className="status-copy">
                    <span className="status-label">{item.label}</span>
                    <strong>{item.value} habitaciones</strong>
                  </div>
                  <span className="status-percent">{item.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel revenue-panel">
          <div className="panel-header">
            <h2>Ingresos</h2>
           </div>

          <div className="revenue-content">
            <div className="empty-state">
              <p></p>
            </div>
          </div>
        </section>

        <section className="panel reservations-panel">
          <div className="panel-header">
            <h2>Reservas próximas</h2>
          </div>

         
          <div className="revenue-content">
            <div className="empty-state">
              <p></p>
            </div>
          </div>
        

          <button type="button" className="panel-link" onClick={() => navigate("/habitaciones")}>Ver todas las reservas <i className="fa-solid fa-chevron-right" /></button>
        </section>

        <section className="panel state-panel">
          <div className="panel-header">
            <h2>Habitaciones por estado</h2>
          </div>

          <div className="state-items">
            <div className="state-row">
              <span className="state-icon gold"><i className="fa-solid fa-bed" /></span>
              <span>Ocupadas</span>
              <strong>{stats.ocupadas}</strong>
            </div>
            <div className="state-row">
              <span className="state-icon gray"><i className="fa-solid fa-door-open" /></span>
              <span>Disponibles</span>
              <strong>{stats.disponibles}</strong>
            </div>
            <div className="state-row">
              <span className="state-icon dark"><i className="fa-solid fa-calendar-check" /></span>
              <span>Reservadas</span>
              <strong>{stats.reservadas}</strong>
            </div>
            <div className="state-row">
              <span className="state-icon bronze"><i className="fa-solid fa-screwdriver-wrench" /></span>
              <span>Mantenimiento</span>
              <strong>{stats.mantenimiento}</strong>
            </div>
          </div>

          <button type="button" className="panel-link" onClick={() => navigate("/habitaciones")}>Ver detalle de habitaciones <i className="fa-solid fa-chevron-right" /></button>
        </section>

        <section className="panel clients-panel">
          <div className="panel-header">
            <h2>Clientes</h2>
          </div>

          <div className="state-items">
            {stats.customerSummary.map((cliente) => (
              <div key={`${cliente.nombre}-${cliente.tipo}`} className="state-row">
                <span className="state-icon gold"><i className="fa-solid fa-user" /></span>
                <span>{cliente.nombre}</span>
                <strong>{cliente.estado}</strong>
              </div>
            ))}
          </div>

          <button type="button" className="panel-link" onClick={() => navigate("/clientes")}>Ver detalle de clientes <i className="fa-solid fa-chevron-right" /></button>
        </section>

        <section className="panel employees-panel">
          <div className="panel-header">
            <h2>Empleados</h2>
          </div>

          <div className="state-items">
            {stats.employeeSummary.map((employee) => (
              <div key={`${employee.nombre}-${employee.tipo}`} className="state-row">
                <span className="state-icon bronze"><i className="fa-solid fa-user-tie" /></span>
                <span>{employee.nombre}</span>
                <strong>{employee.estado}</strong>
              </div>
            ))}
          </div>

          <button type="button" className="panel-link" onClick={() => navigate("/empleados")}>Ver detalle de empleados <i className="fa-solid fa-chevron-right" /></button>
        </section>


      </div>

      <div className="quick-actions">
        <button type="button" data-bs-toggle="modal" data-bs-target="#habitacionModal" onClick={() => setHabitacionEditar(null)}><i className="fa-solid fa-calendar-plus" /> Nueva reserva</button>
        <button type="button" data-bs-toggle="modal" data-bs-target="#clienteModal" onClick={() => setClienteEditar(null)}><i className="fa-solid fa-user-check" /> Nuevo check-in</button>
        <button type="button" data-bs-toggle="modal" data-bs-target="#habitacionModal" onClick={() => setHabitacionEditar(null)}><i className="fa-solid fa-clipboard-list" /> Registrar habitación</button>
        <button type="button" data-bs-toggle="modal" data-bs-target="#empleadoModal" onClick={() => setEmpleadoEditar(null)}><i className="fa-solid fa-user-plus" /> Nuevo empleado</button>
      </div>

      <HabitacionModal habitacionEditar={habitacionEditar} onSuccess={() => window.location.reload()} onHabitacionCreado={() => window.location.reload()} />
      <EmpleadoModal empleadoEditar={empleadoEditar} onSuccess={() => window.location.reload()} onEmpleadoCreado={() => window.location.reload()} />
      <ClienteModal clienteEditar={clienteEditar} onSuccess={() => window.location.reload()} onClienteCreado={() => window.location.reload()} />
    </div>
  );
}

export default Dashboard;
