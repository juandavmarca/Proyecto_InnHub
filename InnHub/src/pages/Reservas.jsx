import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerHabitaciones } from "../services/api";

const resolveStatus = (habitacion) => {
  const estado = String(habitacion.estado || "").trim().toLowerCase();

  if (estado.includes("ocupada")) return "ocupada";
  if (estado.includes("reservada")) return "reservada";
  if (estado.includes("mantenimiento")) return "mantenimiento";
  if (estado.includes("no disponible") || estado.includes("no_disponible")) return "no-disponible";
  if (estado.includes("disponible") || estado.includes("libre")) return "disponible";
  return "sin-estado";
};

const roomStatusLabels = {
  disponible: "Disponible",
  ocupada: "Ocupada",
  reservada: "Reservada",
  mantenimiento: "Mantenimiento",
  "no-disponible": "No disponible",
  "sin-estado": "Sin estado",
};

function Reservas() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    obtenerHabitaciones()
      .then((data) => {
        if (active) {
          setHabitaciones(Array.isArray(data) ? data : []);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || "No se pudieron cargar las habitaciones.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const actualizarHabitaciones = () => {
    setLoading(true);
    setError("");
    setRefreshKey((key) => key + 1);
  };

  const resumen = useMemo(() => {
    const estados = habitaciones.map(resolveStatus);
    return {
      disponibles: estados.filter((estado) => estado === "disponible").length,
      ocupadas: estados.filter((estado) => estado === "ocupada").length,
      mantenimiento: estados.filter((estado) => estado === "mantenimiento").length,
    };
  }, [habitaciones]);

  return (
    <div className="dashboard-page reservations-page">
      <header className="reservations-welcome">
        <div className="reservations-welcome-copy">
          <span className="reservations-eyebrow">
            <i className="fa-solid fa-sparkles" aria-hidden="true" />
            Panel de recepción
          </span>
          <h1>Reservas y habitaciones</h1>
          <p>
            Gestiona la llegada de tus huéspedes y encuentra rápidamente la
            habitación ideal para cada estadía.
          </p>
        </div>
        <Link className="reservations-room-link" to="/Habitaciones">
          <i className="fa-solid fa-bed" aria-hidden="true" />
          Ver habitaciones
          <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
        </Link>
        <div className="reservations-welcome-art" aria-hidden="true">
          <i className="fa-solid fa-bell-concierge" />
        </div>
      </header>

      <section className="reservations-stats" aria-label="Resumen de habitaciones">
        <article className="reservations-stat-card">
          <span className="reservations-stat-icon reservations-stat-icon-gold">
            <i className="fa-regular fa-calendar-check" aria-hidden="true" />
          </span>
          <div>
            <span className="reservations-stat-label">Reservas por asignar</span>
            <strong>—</strong>
            <small>Se mostrarán al conectar los pagos</small>
          </div>
        </article>
        <article className="reservations-stat-card">
          <span className="reservations-stat-icon reservations-stat-icon-green">
            <i className="fa-solid fa-door-open" aria-hidden="true" />
          </span>
          <div>
            <span className="reservations-stat-label">Habitaciones disponibles</span>
            <strong>{loading ? "…" : resumen.disponibles}</strong>
            <small>Listas para asignar</small>
          </div>
        </article>
        <article className="reservations-stat-card">
          <span className="reservations-stat-icon reservations-stat-icon-blue">
            <i className="fa-solid fa-key" aria-hidden="true" />
          </span>
          <div>
            <span className="reservations-stat-label">Habitaciones ocupadas</span>
            <strong>{loading ? "…" : resumen.ocupadas}</strong>
            <small>Estado actual del hotel</small>
          </div>
        </article>
      </section>

      <section className="reservations-integration-note" aria-label="Estado de integración de pagos">
        <span className="reservations-note-icon">
          <i className="fa-solid fa-link" aria-hidden="true" />
        </span>
        <div>
          <strong>La conexión con Wompi está pendiente</strong>
          <p>
            Cuando se integre el pago, las reservas confirmadas aparecerán aquí
            para que el equipo les asigne una habitación. Por ahora esta pantalla
            no recibe ni confirma pagos.
          </p>
        </div>
        <span className="reservations-connection-status">
          <span aria-hidden="true" />
          Pendiente
        </span>
      </section>

      <section className="reservations-main-card">
        <div className="reservations-section-heading">
          <div>
            <span className="reservations-section-kicker">Gestión de huéspedes</span>
            <h2>Reservas por asignar</h2>
            <p>Las reservas pagadas aparecerán aquí para asignarles una habitación.</p>
          </div>
          <span className="reservations-count-badge">
            <i className="fa-regular fa-clock" aria-hidden="true" />
            En espera
          </span>
        </div>

        <div className="reservations-empty-state">
          <div className="reservations-empty-illustration" aria-hidden="true">
            <span className="reservations-empty-sun" />
            <i className="fa-regular fa-calendar-check" />
            <span className="reservations-empty-bed">
              <i className="fa-solid fa-bed" />
            </span>
          </div>
          <h3>Aún no hay reservas para asignar</h3>
          <p>
            Cuando el cliente complete su pago y la integración esté activa,
            verás aquí sus fechas, datos y el botón para elegir habitación.
          </p>
          <Link className="reservations-empty-link" to="/Habitaciones">
            Consultar habitaciones disponibles
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="reservations-rooms-card">
        <div className="reservations-section-heading">
          <div>
            <span className="reservations-section-kicker">Inventario en tiempo real</span>
            <h2>Estado de las habitaciones</h2>
            <p>Disponibilidad reportada por el sistema de habitaciones.</p>
          </div>
          <button
            type="button"
            className="reservations-refresh-button"
            onClick={actualizarHabitaciones}
            disabled={loading}
          >
            <i className={`fa-solid fa-rotate${loading ? " fa-spin" : ""}`} aria-hidden="true" />
            Actualizar
          </button>
        </div>

        {error ? (
          <div className="reservations-load-error" role="alert">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            <span>{error}</span>
            <button type="button" onClick={actualizarHabitaciones}>
              Reintentar
            </button>
          </div>
        ) : loading ? (
          <div className="reservations-rooms-loading" role="status">
            <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
            Cargando habitaciones…
          </div>
        ) : habitaciones.length === 0 ? (
          <div className="reservations-rooms-empty">
            No hay habitaciones registradas todavía.
          </div>
        ) : (
          <div className="reservations-room-grid">
            {habitaciones.map((habitacion) => {
              const status = resolveStatus(habitacion);
              return (
                <article className="reservations-room-item" key={habitacion.id_habitacion}>
                  <span className={`reservations-room-icon is-${status}`}>
                    <i className="fa-solid fa-bed" aria-hidden="true" />
                  </span>
                  <div className="reservations-room-info">
                    <strong>Habitación {habitacion.numero || "—"}</strong>
                    <span>{habitacion.tipo || "Tipo sin especificar"}</span>
                  </div>
                  <span className={`reservations-room-status is-${status}`}>
                    <span aria-hidden="true" />
                    {roomStatusLabels[status]}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Reservas;
