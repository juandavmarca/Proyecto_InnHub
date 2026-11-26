import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  confirmarReservaRecepcion,
  consultarEstadoPago,
  obtenerHabitaciones,
  obtenerHabitacionesParaReserva,
  obtenerReservasPendientesRecepcion,
} from "../services/api";

const ReservaRecepcionModal = lazy(() => import("../components/ReservaRecepcionModal"));

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

const roomIsAvailable = (room) => Number(room.disponible) === 1 || room.disponible === true;

const formatReservationDate = (value) => {
  const [year, month, day] = String(value || "").slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
};

function ReservationAssignmentCard({ reserva, onConfirm, confirming }) {
  const [habitaciones, setHabitaciones] = useState(null);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState("");
  const [cargandoHabitaciones, setCargandoHabitaciones] = useState(false);
  const [errorHabitaciones, setErrorHabitaciones] = useState("");

  const cargarHabitaciones = async () => {
    setCargandoHabitaciones(true);
    setErrorHabitaciones("");

    try {
      const resultado = await obtenerHabitacionesParaReserva(reserva.id_reserva);
      const opciones = Array.isArray(resultado.habitaciones) ? resultado.habitaciones : [];
      setHabitaciones(opciones);
      const habitacionActual = opciones.find(
        (room) => String(room.id_habitacion) === String(reserva.id_habitacion) && roomIsAvailable(room)
      );
      const primeraDisponible = opciones.find(roomIsAvailable);
      setHabitacionSeleccionada(String(habitacionActual?.id_habitacion || primeraDisponible?.id_habitacion || ""));
    } catch (error) {
      setErrorHabitaciones(error.message || "No se pudieron consultar las habitaciones.");
    } finally {
      setCargandoHabitaciones(false);
    }
  };

  const nombreHuesped = `${reserva.nombre_cliente || ""} ${reserva.apellido_cliente || ""}`.trim() || "Huésped";
  const total = Number(reserva.monto_total);
  const pago = Number(reserva.monto_pagado);
  const saldo = Number.isFinite(total) && Number.isFinite(pago) ? Math.max(total - pago, 0) : null;

  return (
    <article className="reservation-assignment-card">
      <header className="reservation-assignment-heading">
        <div className="reservation-assignment-identity">
          <div className="reservation-assignment-reference">
            <span>Reserva</span>
            <strong>#{reserva.id_reserva}</strong>
          </div>
          <div className="reservation-assignment-guest">
            <span>Huésped</span>
            <strong>{nombreHuesped}</strong>
            <small>
              {reserva.telefono || "Teléfono no registrado"}
              {reserva.email ? ` · ${reserva.email}` : ""}
            </small>
          </div>
        </div>
        <div className="reservation-assignment-badges">
          <span className="reservation-assignment-payment">
            <i className="fa-solid fa-circle-check" aria-hidden="true" />
            Pago aprobado
          </span>
          <span className="reservation-assignment-waiting">En espera</span>
        </div>
      </header>

      <div className="reservation-assignment-stay">
        <div className="reservation-assignment-stay-icon" aria-hidden="true">
          <i className="fa-regular fa-calendar-check" />
        </div>
        <div className="reservation-assignment-date">
          <span>Entrada</span>
          <strong>{formatReservationDate(reserva.fecha_entrada)}</strong>
        </div>
        <i className="fa-solid fa-arrow-right reservation-assignment-date-arrow" aria-hidden="true" />
        <div className="reservation-assignment-date">
          <span>Salida</span>
          <strong>{formatReservationDate(reserva.fecha_salida)}</strong>
        </div>
        <div className="reservation-assignment-stay-meta">
          <span><i className="fa-solid fa-bed" aria-hidden="true" />{reserva.tipo_habitacion || "Tipo sin especificar"}</span>
          <span>
            <i className="fa-solid fa-user-group" aria-hidden="true" />
            {reserva.numero_persona || "—"} {Number(reserva.numero_persona) === 1 ? "persona" : "personas"}
          </span>
        </div>
      </div>

      <div className="reservation-assignment-payment-summary">
        <div>
          <span>Pago recibido</span>
          <strong>{formatMoney(reserva.monto_pagado)}</strong>
        </div>
        <div>
          <span>Total de estadía</span>
          <strong>{formatMoney(reserva.monto_total)}</strong>
        </div>
        {saldo !== null && saldo > 0 && (
          <div className="reservation-assignment-balance">
            <span>Saldo en el hotel</span>
            <strong>{formatMoney(saldo)}</strong>
          </div>
        )}
        <div className="reservation-assignment-payment-method">
          <span>Método de pago</span>
          <strong><i className="fa-regular fa-credit-card" aria-hidden="true" />{reserva.metodo_pago || "—"}</strong>
        </div>
      </div>

      {reserva.observacion && (
        <p className="reservation-assignment-note">{reserva.observacion}</p>
      )}

      <div className="reservation-assignment-controls">
        {habitaciones === null ? (
          <button
            type="button"
            className="reservations-refresh-button"
            onClick={cargarHabitaciones}
            disabled={cargandoHabitaciones}
          >
            <i className={`fa-solid ${cargandoHabitaciones ? "fa-spinner fa-spin" : "fa-bed"}`} aria-hidden="true" />
            {cargandoHabitaciones ? "Buscando habitaciones…" : "Asignar habitación"}
          </button>
        ) : habitaciones.length === 0 ? (
          <p className="reservation-assignment-unavailable">
            No hay habitaciones registradas del tipo solicitado.
          </p>
        ) : (
          <>
            <label>
              Número de habitación
              <select
                value={habitacionSeleccionada}
                onChange={(event) => setHabitacionSeleccionada(event.target.value)}
                disabled={confirming}
              >
                <option value="">Selecciona un número disponible</option>
                {habitaciones.map((room) => {
                  const disponible = roomIsAvailable(room);
                  const estado = String(room.estado || "").trim();
                  const motivo = estado.toLowerCase() === "disponible"
                    ? "asignada para esas fechas"
                    : estado || "no disponible";

                  return (
                    <option
                      key={room.id_habitacion}
                      value={room.id_habitacion}
                      disabled={!disponible}
                    >
                      Habitación {room.numero || room.id_habitacion}
                      {disponible ? "" : ` · No disponible (${motivo})`}
                    </option>
                  );
                })}
              </select>
            </label>
            <button
              type="button"
              className="reservations-confirm-button"
              onClick={() => onConfirm(reserva, habitacionSeleccionada)}
              disabled={!habitacionSeleccionada || confirming}
            >
              <i className={`fa-solid ${confirming ? "fa-spinner fa-spin" : "fa-check"}`} aria-hidden="true" />
              {confirming ? "Confirmando…" : "Asignar y confirmar"}
            </button>
            <button
              type="button"
              className="reservations-refresh-button"
              onClick={cargarHabitaciones}
              disabled={cargandoHabitaciones || confirming}
            >
              Actualizar opciones
            </button>
            {!habitaciones.some(roomIsAvailable) && (
              <p className="reservation-assignment-unavailable">
                No hay habitaciones libres de este tipo para las fechas de la reserva.
              </p>
            )}
          </>
        )}
      </div>

      {errorHabitaciones && (
        <p className="reservation-assignment-error" role="alert">{errorHabitaciones}</p>
      )}
    </article>
  );
}

function Reservas() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [reservas, setReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [reservasError, setReservasError] = useState("");
  const [reservasNotice, setReservasNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [queueRefreshKey, setQueueRefreshKey] = useState(0);
  const [confirmingId, setConfirmingId] = useState(null);
  const [mostrarCrearReserva, setMostrarCrearReserva] = useState(false);

  useEffect(() => {
    let active = true;

    obtenerHabitaciones()
      .then((data) => {
        if (active) setHabitaciones(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (active) setRoomsError(error.message || "No se pudieron cargar las habitaciones.");
      })
      .finally(() => {
        if (active) setLoadingRooms(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let active = true;

    obtenerReservasPendientesRecepcion()
      .then((data) => {
        if (active) {
          setReservas(Array.isArray(data.reservas) ? data.reservas : []);
          setReservasError("");
        }
      })
      .catch((error) => {
        if (active) setReservasError(error.message || "No se pudieron cargar las reservas.");
      })
      .finally(() => {
        if (active) setLoadingReservas(false);
      });

    return () => {
      active = false;
    };
  }, [queueRefreshKey]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setQueueRefreshKey((key) => key + 1);
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const referencia = parametros.get("pago");
    if (!referencia) return undefined;

    parametros.delete("pago");
    const query = parametros.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
    );

    let active = true;
    let timeout;
    let intentos = 0;
    let revisarPago;
    const reintentar = () => {
      intentos += 1;
      timeout = window.setTimeout(revisarPago, 2000);
    };
    revisarPago = async () => {
      try {
        const resultado = await consultarEstadoPago(referencia);
        if (!active) return;

        const estadoPago = String(resultado.estado || "").toUpperCase();
        const estadoReserva = String(resultado.estado_reserva || "").trim().toLowerCase();
        if (estadoPago === "APPROVED" && estadoReserva === "confirmada") {
          setReservasNotice(
            `¡Pago aprobado! La reserva #${resultado.id_reserva} quedó confirmada para la habitación ${resultado.numero_habitacion || resultado.id_habitacion}.`
          );
          setReservasError("");
          setRefreshKey((key) => key + 1);
          setQueueRefreshKey((key) => key + 1);
          return;
        }

        if (estadoPago === "APPROVED" && ["pendiente de confirmación", "pago aprobado"].includes(estadoReserva)) {
          try {
            const confirmacion = await confirmarReservaRecepcion(
              Number(resultado.id_reserva),
              Number(resultado.id_habitacion)
            );
            if (!active) return;
            setReservasNotice(
              `¡Pago aprobado! ${confirmacion.mensaje} Reserva #${resultado.id_reserva}, habitación ${resultado.numero_habitacion || resultado.id_habitacion}.`
            );
            setReservasError("");
            setRefreshKey((key) => key + 1);
            setQueueRefreshKey((key) => key + 1);
          } catch (error) {
            if (!active) return;
            const estadoActualizado = await consultarEstadoPago(referencia);
            if (!active) return;
            if (String(estadoActualizado.estado_reserva || "").trim().toLowerCase() === "confirmada") {
              setReservasNotice(
                `¡Pago aprobado! La reserva #${estadoActualizado.id_reserva} quedó confirmada para la habitación ${estadoActualizado.numero_habitacion || estadoActualizado.id_habitacion}.`
              );
              setReservasError("");
            } else {
              setReservasError(
                `Wompi aprobó el pago, pero no se pudo confirmar la habitación automáticamente: ${error.message || "verifica la disponibilidad en la lista de reservas pagadas por confirmar."}`
              );
            }
            setRefreshKey((key) => key + 1);
            setQueueRefreshKey((key) => key + 1);
          }
          return;
        }

        if (["DECLINED", "VOIDED", "ERROR"].includes(estadoPago)) {
          setReservasError("Wompi no aprobó el pago. La reserva no fue confirmada.");
          setQueueRefreshKey((key) => key + 1);
          return;
        }

        if (intentos >= 14) {
          setReservasNotice("El pago sigue en confirmación. No inicies otro pago; actualiza la lista en unos minutos.");
          return;
        }
        reintentar();
      } catch (error) {
        if (active) {
          setReservasError(error.message || "No se pudo consultar el estado del pago.");
        }
      }
    };

    revisarPago();
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, []);

  const actualizarDatos = () => {
    setLoadingRooms(true);
    setLoadingReservas(true);
    setRoomsError("");
    setReservasError("");
    setReservasNotice("");
    setRefreshKey((key) => key + 1);
    setQueueRefreshKey((key) => key + 1);
  };

  const confirmarReserva = async (reserva, idHabitacion) => {
    setConfirmingId(reserva.id_reserva);
    setReservasError("");
    setReservasNotice("");

    try {
      const resultado = await confirmarReservaRecepcion(reserva.id_reserva, Number(idHabitacion));
      setReservas((actuales) => actuales.filter((item) => item.id_reserva !== reserva.id_reserva));
      setReservasNotice(resultado.mensaje || `La reserva #${reserva.id_reserva} quedó confirmada.`);
    } catch (error) {
      setReservasError(error.message || "No se pudo confirmar la reserva.");
      setQueueRefreshKey((key) => key + 1);
    } finally {
      setConfirmingId(null);
    }
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
            Revisa los pagos aprobados, asigna una habitación del tipo solicitado
            y confirma la estadía del huésped.
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

      <section className="reservations-stats" aria-label="Resumen de recepción">
        <article className="reservations-stat-card">
          <span className="reservations-stat-icon reservations-stat-icon-gold">
            <i className="fa-regular fa-calendar-check" aria-hidden="true" />
          </span>
          <div>
            <span className="reservations-stat-label">Pagadas por confirmar</span>
            <strong>{loadingReservas ? "…" : reservas.length}</strong>
            <small>Esperan asignación de habitación</small>
          </div>
        </article>
        <article className="reservations-stat-card">
          <span className="reservations-stat-icon reservations-stat-icon-green">
            <i className="fa-solid fa-door-open" aria-hidden="true" />
          </span>
          <div>
            <span className="reservations-stat-label">Habitaciones disponibles</span>
            <strong>{loadingRooms ? "…" : resumen.disponibles}</strong>
            <small>Estado actual del hotel</small>
          </div>
        </article>
        <article className="reservations-stat-card">
          <span className="reservations-stat-icon reservations-stat-icon-blue">
            <i className="fa-solid fa-key" aria-hidden="true" />
          </span>
          <div>
            <span className="reservations-stat-label">Habitaciones ocupadas</span>
            <strong>{loadingRooms ? "…" : resumen.ocupadas}</strong>
            <small>Estado actual del hotel</small>
          </div>
        </article>
      </section>

      <section className="reservations-create-card" aria-labelledby="reservations-create-title">
        <span className="reservations-stat-icon reservations-stat-icon-gold reservations-create-icon" aria-hidden="true">
          <i className="fa-solid fa-plus" />
        </span>
        <div className="reservations-create-copy">
          <span className="reservations-section-kicker">Atención presencial</span>
          <h2 id="reservations-create-title">Realizar una reserva</h2>
          <p>Registra la estadía de un huésped, selecciona su habitación y gestiona el pago desde el panel.</p>
        </div>
        <button
          type="button"
          className="reservation-create-trigger"
          onClick={() => setMostrarCrearReserva(true)}
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Iniciar reserva
        </button>
      </section>

      <section className="reservations-integration-note" aria-label="Estado de pagos">
        <span className="reservations-note-icon">
          <i className="fa-solid fa-shield-halved" aria-hidden="true" />
        </span>
        <div>
          <strong>Los pagos se confirman con Wompi</strong>
          <p>
            Solo aparecen aquí las reservas cuyo pago fue aprobado por la notificación
            verificada de Wompi. La reserva queda confirmada cuando se asigna la habitación.
            Por ahora, las reservas pagadas no se pueden rechazar hasta habilitar las devoluciones.
          </p>
        </div>
        <span className="reservations-connection-status">
          <span aria-hidden="true" />
          Verificado
        </span>
      </section>

      <section className="reservations-main-card">
        <div className="reservations-section-heading">
          <div>
            <span className="reservations-section-kicker">Gestión de huéspedes</span>
            <h2>Reservas pagadas por confirmar</h2>
            <p>Asigna un número del tipo solicitado; los números no disponibles se muestran desactivados.</p>
          </div>
          <div className="reservations-queue-actions">
            <span className="reservations-count-badge">
              <i className="fa-regular fa-clock" aria-hidden="true" />
              {reservas.length} en espera
            </span>
            <button
              type="button"
              className="reservations-refresh-button"
              onClick={actualizarDatos}
              disabled={loadingReservas || loadingRooms}
            >
              <i className={`fa-solid fa-rotate${loadingReservas || loadingRooms ? " fa-spin" : ""}`} aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </div>

        {reservasNotice && <p className="reservation-assignment-notice" role="status">{reservasNotice}</p>}
        {reservasError && <p className="reservations-load-error" role="alert">{reservasError}</p>}
        {loadingReservas ? (
          <div className="reservations-rooms-loading" role="status">
            <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
            Consultando pagos aprobados…
          </div>
        ) : reservasError ? null : reservas.length === 0 ? (
          <div className="reservations-empty-state">
            <div className="reservations-empty-illustration" aria-hidden="true">
              <span className="reservations-empty-sun" />
              <i className="fa-regular fa-calendar-check" />
              <span className="reservations-empty-bed">
                <i className="fa-solid fa-bed" />
              </span>
            </div>
            <h3>No hay reservas pagadas por confirmar</h3>
            <p>
              Cuando Wompi apruebe un pago, la reserva aparecerá aquí para que puedas asignarle
              una habitación y confirmarla.
            </p>
          </div>
        ) : (
          <div className="reservation-assignment-list">
            {reservas.map((reserva) => (
              <ReservationAssignmentCard
                key={reserva.id_reserva}
                reserva={reserva}
                onConfirm={confirmarReserva}
                confirming={confirmingId === reserva.id_reserva}
              />
            ))}
          </div>
        )}
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
            onClick={actualizarDatos}
            disabled={loadingRooms || loadingReservas}
          >
            <i className={`fa-solid fa-rotate${loadingRooms ? " fa-spin" : ""}`} aria-hidden="true" />
            Actualizar
          </button>
        </div>

        {roomsError ? (
          <div className="reservations-load-error" role="alert">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            <span>{roomsError}</span>
          </div>
        ) : loadingRooms ? (
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

      {mostrarCrearReserva && (
        <Suspense fallback={
          <div className="reservation-create-backdrop">
            <div className="reservation-create-loading" role="status">Cargando formulario de reserva…</div>
          </div>
        }>
          <ReservaRecepcionModal
            habitaciones={habitaciones}
            onClose={() => setMostrarCrearReserva(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default Reservas;
