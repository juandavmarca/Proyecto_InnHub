import { useEffect, useMemo, useState } from "react";
import {
  crearCliente,
  iniciarPagoReservaRecepcion,
  obtenerClientes,
  obtenerHabitacionesDisponiblesParaNuevaReserva,
} from "../services/api";

const TARIFA_POR_PERSONA = 65000;

const normalizarTexto = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");

const fechaLocal = () => {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
};

const siguienteFecha = (fecha) => {
  if (!fecha) return "";
  const [year, month, day] = fecha.split("-").map(Number);
  const siguiente = new Date(Date.UTC(year, month - 1, day + 1));
  return siguiente.toISOString().slice(0, 10);
};

const formatearPesos = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);

function ReservaRecepcionModal({ habitaciones, onClose }) {
  const [clientes, setClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [errorClientes, setErrorClientes] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [idCliente, setIdCliente] = useState("");
  const [registrarCliente, setRegistrarCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    documento: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
  });
  const [errorNuevoCliente, setErrorNuevoCliente] = useState("");
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [numeroPersonas, setNumeroPersonas] = useState("2");
  const [tipoHabitacion, setTipoHabitacion] = useState("");
  const [idHabitacion, setIdHabitacion] = useState("");
  const [opcionesHabitacion, setOpcionesHabitacion] = useState([]);
  const [cargandoHabitaciones, setCargandoHabitaciones] = useState(false);
  const [errorHabitaciones, setErrorHabitaciones] = useState("");
  const [porcentajePago, setPorcentajePago] = useState("");
  const [enviandoPago, setEnviandoPago] = useState(false);
  const [errorReserva, setErrorReserva] = useState("");

  useEffect(() => {
    let active = true;

    obtenerClientes()
      .then((data) => {
        if (active) {
          setClientes(Array.isArray(data) ? data : []);
          setErrorClientes("");
        }
      })
      .catch((error) => {
        if (active) setErrorClientes(error.message || "No se pudieron cargar los clientes.");
      })
      .finally(() => {
        if (active) setCargandoClientes(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!fechaEntrada || !fechaSalida || fechaSalida <= fechaEntrada || !tipoHabitacion) {
      return undefined;
    }

    let active = true;
    obtenerHabitacionesDisponiblesParaNuevaReserva(fechaEntrada, fechaSalida, tipoHabitacion)
      .then((resultado) => {
        if (active) {
          setOpcionesHabitacion(
            Array.isArray(resultado.habitaciones) ? resultado.habitaciones : []
          );
        }
      })
      .catch((error) => {
        if (active) {
          setOpcionesHabitacion([]);
          setErrorHabitaciones(error.message || "No se pudieron consultar las habitaciones.");
        }
      })
      .finally(() => {
        if (active) setCargandoHabitaciones(false);
      });

    return () => {
      active = false;
    };
  }, [fechaEntrada, fechaSalida, tipoHabitacion]);

  useEffect(() => {
    if (enviandoPago) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [enviandoPago, onClose]);

  const tiposHabitacion = useMemo(
    () => [...new Set(habitaciones.map((room) => String(room.tipo || "").trim()).filter(Boolean))],
    [habitaciones]
  );

  const clientesActivos = clientes.filter((cliente) => {
    const estado = String(cliente.estado || "").toLowerCase();
    const deshabilitado = cliente.deshabilitado === true || Number(cliente.deshabilitado) === 1;
    return !deshabilitado && !estado.includes("deshabil");
  });
  const clientesFiltrados = clientesActivos.filter((cliente) => {
    const texto = normalizarTexto(
      `${cliente.nombre || ""} ${cliente.apellido || ""} ${cliente.documento || ""} ${cliente.telefono || ""} ${cliente.email || ""}`
    );
    return texto.includes(normalizarTexto(busquedaCliente));
  });
  const habitacionesDisponibles = opcionesHabitacion.filter(
    (room) => Number(room.disponible) === 1 || room.disponible === true
  );
  const noches = fechaEntrada && fechaSalida && fechaSalida > fechaEntrada
    ? Math.round((Date.parse(`${fechaSalida}T00:00:00Z`) - Date.parse(`${fechaEntrada}T00:00:00Z`)) / 86400000)
    : 0;
  const totalEstadia = TARIFA_POR_PERSONA * Number(numeroPersonas || 0) * noches;
  const pagoAhora = porcentajePago === "50" ? Math.floor(totalEstadia / 2) : totalEstadia;

  const actualizarNuevoCliente = (event) => {
    setNuevoCliente((actual) => ({ ...actual, [event.target.name]: event.target.value }));
  };

  const guardarClienteNuevo = async () => {
    const nombre = nuevoCliente.nombre.trim();
    const apellido = nuevoCliente.apellido.trim();
    const telefono = nuevoCliente.telefono.trim();
    const email = nuevoCliente.email.trim();
    if (!nombre || !apellido || !telefono || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorNuevoCliente("Completa nombre, apellido, teléfono y un correo válido.");
      return;
    }

    setGuardandoCliente(true);
    setErrorNuevoCliente("");
    try {
      const datos = {
        ...nuevoCliente,
        nombre,
        apellido,
        telefono,
        email,
      };
      const resultado = await crearCliente(datos);
      const creado = {
        ...datos,
        id_cliente: resultado.id_cliente,
        estado: "Activo",
        deshabilitado: false,
      };
      setClientes((actuales) => [...actuales, creado]);
      setIdCliente(String(resultado.id_cliente));
      setBusquedaCliente(`${nombre} ${apellido}`);
      setRegistrarCliente(false);
    } catch (error) {
      setErrorNuevoCliente(error.message || "No se pudo registrar el cliente.");
    } finally {
      setGuardandoCliente(false);
    }
  };

  const iniciarPago = async (event) => {
    event.preventDefault();
    setErrorReserva("");
    if (!idCliente || !idHabitacion || !porcentajePago) {
      setErrorReserva("Selecciona el cliente, la habitación y el porcentaje que se pagará.");
      return;
    }

    setEnviandoPago(true);
    try {
      const resultado = await iniciarPagoReservaRecepcion({
        id_cliente: Number(idCliente),
        id_habitacion: Number(idHabitacion),
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        numero_persona: Number(numeroPersonas),
        porcentaje_pago: Number(porcentajePago),
      });
      const parametros = new URLSearchParams({
        "public-key": resultado.llavePublica,
        currency: "COP",
        "amount-in-cents": String(resultado.montoCentavos),
        reference: resultado.referencia,
        "signature:integrity": resultado.firmaIntegridad,
        "expiration-time": resultado.expiracion,
        "customer-data:email": resultado.cliente.email,
        "customer-data:full-name": resultado.cliente.nombreCompleto,
      });
      const telefono = String(resultado.cliente.telefono || "").replace(/\D/g, "");
      if (telefono) {
        parametros.set("customer-data:phone-number", telefono.startsWith("57") ? telefono.slice(2) : telefono);
        parametros.set("customer-data:phone-number-prefix", "+57");
      }

      const urlRetorno = new URL(window.location.href);
      urlRetorno.searchParams.set("pago", resultado.referencia);
      parametros.set("redirect-url", urlRetorno.toString());
      window.location.assign(`https://checkout.wompi.co/p/?${parametros.toString()}`);
    } catch (error) {
      setErrorReserva(error.message || "No se pudo iniciar el pago con Wompi.");
      setEnviandoPago(false);
    }
  };

  return (
    <div
      className="reservation-create-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !enviandoPago) onClose();
      }}
    >
      <section
        className="reservation-create-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-create-title"
      >
        <header className="reservation-create-header">
          <div>
            <span className="reservation-create-eyebrow">Atención en recepción</span>
            <h2 id="reservation-create-title">Crear reserva</h2>
            <p>Registra al huésped, selecciona su habitación y continúa al pago seguro de Wompi.</p>
          </div>
          <button type="button" className="reservation-create-close" onClick={onClose} disabled={enviandoPago} aria-label="Cerrar">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </header>

        <form className="reservation-create-form" onSubmit={iniciarPago}>
          <section className="reservation-create-section">
            <div className="reservation-create-section-heading">
              <span>01</span>
              <div>
                <h3>Datos del huésped</h3>
                <p>Busca un cliente existente o registra uno nuevo.</p>
              </div>
            </div>

            {errorClientes && <p className="reservation-create-error" role="alert">{errorClientes}</p>}
            {!registrarCliente ? (
              <>
                <label className="reservation-create-field">
                  Buscar cliente
                  <input
                    type="search"
                    value={busquedaCliente}
                    onChange={(event) => setBusquedaCliente(event.target.value)}
                    placeholder="Nombre, documento, teléfono o correo"
                    disabled={cargandoClientes || enviandoPago}
                  />
                </label>
                <label className="reservation-create-field">
                  Cliente
                  <select
                    value={idCliente}
                    onChange={(event) => setIdCliente(event.target.value)}
                    disabled={cargandoClientes || enviandoPago}
                    required
                  >
                    <option value="">
                      {cargandoClientes ? "Cargando clientes…" : "Selecciona un cliente"}
                    </option>
                    {clientesFiltrados.map((cliente) => (
                      <option key={cliente.id_cliente} value={cliente.id_cliente}>
                        {cliente.nombre} {cliente.apellido} · {cliente.documento || cliente.telefono || cliente.email}
                      </option>
                    ))}
                  </select>
                </label>
                {!cargandoClientes && clientesFiltrados.length === 0 && (
                  <p className="reservation-create-help">No hay clientes que coincidan con la búsqueda.</p>
                )}
                <button
                  type="button"
                  className="reservation-create-link"
                  onClick={() => {
                    setIdCliente("");
                    setRegistrarCliente(true);
                    setErrorNuevoCliente("");
                  }}
                  disabled={enviandoPago}
                >
                  <i className="fa-solid fa-user-plus" aria-hidden="true" />
                  Registrar cliente nuevo
                </button>
              </>
            ) : (
              <div className="reservation-new-client">
                <div className="reservation-new-client-fields">
                  <label className="reservation-create-field">
                    Nombre
                    <input name="nombre" value={nuevoCliente.nombre} onChange={actualizarNuevoCliente} maxLength={100} disabled={guardandoCliente} />
                  </label>
                  <label className="reservation-create-field">
                    Apellido
                    <input name="apellido" value={nuevoCliente.apellido} onChange={actualizarNuevoCliente} maxLength={100} disabled={guardandoCliente} />
                  </label>
                  <label className="reservation-create-field">
                    Teléfono
                    <input name="telefono" type="tel" value={nuevoCliente.telefono} onChange={actualizarNuevoCliente} maxLength={20} disabled={guardandoCliente} />
                  </label>
                  <label className="reservation-create-field">
                    Correo electrónico
                    <input name="email" type="email" value={nuevoCliente.email} onChange={actualizarNuevoCliente} maxLength={100} disabled={guardandoCliente} />
                  </label>
                  <label className="reservation-create-field reservation-new-client-document">
                    Documento <span>(opcional)</span>
                    <input name="documento" value={nuevoCliente.documento} onChange={actualizarNuevoCliente} maxLength={20} disabled={guardandoCliente} />
                  </label>
                </div>
                {errorNuevoCliente && <p className="reservation-create-error" role="alert">{errorNuevoCliente}</p>}
                <div className="reservation-new-client-actions">
                  <button type="button" className="reservation-create-secondary" onClick={() => setRegistrarCliente(false)} disabled={guardandoCliente}>
                    Volver a buscar
                  </button>
                  <button type="button" className="reservation-create-link" onClick={guardarClienteNuevo} disabled={guardandoCliente}>
                    {guardandoCliente ? "Guardando…" : "Guardar cliente"}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="reservation-create-section">
            <div className="reservation-create-section-heading">
              <span>02</span>
              <div>
                <h3>Estadía y habitación</h3>
                <p>La disponibilidad se valida nuevamente antes de iniciar el pago.</p>
              </div>
            </div>
            <div className="reservation-create-grid">
              <label className="reservation-create-field">
                Fecha de entrada
                <input
                  type="date"
                  value={fechaEntrada}
                  min={fechaLocal()}
                  onChange={(event) => {
                    const nuevaFecha = event.target.value;
                    const nuevaSalida = fechaSalida && fechaSalida <= nuevaFecha ? "" : fechaSalida;
                    setFechaEntrada(nuevaFecha);
                    if (nuevaSalida !== fechaSalida) setFechaSalida("");
                    setOpcionesHabitacion([]);
                    setIdHabitacion("");
                    setErrorHabitaciones("");
                    setCargandoHabitaciones(Boolean(nuevaFecha && nuevaSalida && nuevaSalida > nuevaFecha && tipoHabitacion));
                  }}
                  required
                  disabled={enviandoPago}
                />
              </label>
              <label className="reservation-create-field">
                Fecha de salida
                <input
                  type="date"
                  value={fechaSalida}
                  min={fechaEntrada ? siguienteFecha(fechaEntrada) : siguienteFecha(fechaLocal())}
                  onChange={(event) => {
                    const nuevaFecha = event.target.value;
                    setFechaSalida(nuevaFecha);
                    setOpcionesHabitacion([]);
                    setIdHabitacion("");
                    setErrorHabitaciones("");
                    setCargandoHabitaciones(Boolean(fechaEntrada && nuevaFecha > fechaEntrada && tipoHabitacion));
                  }}
                  required
                  disabled={enviandoPago}
                />
              </label>
              <label className="reservation-create-field">
                Número de huéspedes
                <select value={numeroPersonas} onChange={(event) => setNumeroPersonas(event.target.value)} disabled={enviandoPago}>
                  {[1, 2, 3, 4, 5, 6].map((cantidad) => (
                    <option key={cantidad} value={cantidad}>{cantidad} {cantidad === 1 ? "persona" : "personas"}</option>
                  ))}
                </select>
              </label>
              <label className="reservation-create-field">
                Tipo de habitación
                <select
                  value={tipoHabitacion}
                  onChange={(event) => {
                    const nuevoTipo = event.target.value;
                    setTipoHabitacion(nuevoTipo);
                    setIdHabitacion("");
                    setOpcionesHabitacion([]);
                    setErrorHabitaciones("");
                    setCargandoHabitaciones(Boolean(fechaEntrada && fechaSalida > fechaEntrada && nuevoTipo));
                  }}
                  disabled={enviandoPago}
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  {tiposHabitacion.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </label>
              <label className="reservation-create-field reservation-create-room-field">
                Número de habitación
                <select
                  value={idHabitacion}
                  onChange={(event) => setIdHabitacion(event.target.value)}
                  disabled={!habitacionesDisponibles.length || cargandoHabitaciones || enviandoPago}
                  required
                >
                  <option value="">
                    {cargandoHabitaciones ? "Consultando disponibilidad…" : "Selecciona una habitación"}
                  </option>
                  {habitacionesDisponibles.map((room) => (
                    <option key={room.id_habitacion} value={room.id_habitacion}>
                      Habitación {room.numero || room.id_habitacion}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {errorHabitaciones && <p className="reservation-create-error" role="alert">{errorHabitaciones}</p>}
            {!errorHabitaciones && fechaEntrada && fechaSalida && tipoHabitacion && !cargandoHabitaciones && habitacionesDisponibles.length === 0 && (
              <p className="reservation-create-help">No hay habitaciones disponibles de ese tipo en las fechas seleccionadas.</p>
            )}
          </section>

          <section className="reservation-create-section">
            <div className="reservation-create-section-heading">
              <span>03</span>
              <div>
                <h3>Pago con Wompi</h3>
                <p>Elige el valor que el huésped pagará ahora.</p>
              </div>
            </div>
            <div className="reservation-create-payment-options">
              <label className={porcentajePago === "50" ? "is-selected" : ""}>
                <input type="radio" name="porcentaje-pago-recepcion" value="50" checked={porcentajePago === "50"} onChange={(event) => setPorcentajePago(event.target.value)} />
                <span>
                  <strong>Abono del 50%</strong>
                  <small>El saldo restante se paga en el hotel.</small>
                </span>
                <b>{formatearPesos(Math.floor(totalEstadia / 2))}</b>
              </label>
              <label className={porcentajePago === "100" ? "is-selected" : ""}>
                <input type="radio" name="porcentaje-pago-recepcion" value="100" checked={porcentajePago === "100"} onChange={(event) => setPorcentajePago(event.target.value)} />
                <span>
                  <strong>Pagar el total</strong>
                  <small>El huésped paga toda la estadía ahora.</small>
                </span>
                <b>{formatearPesos(totalEstadia)}</b>
              </label>
            </div>
            <div className="reservation-create-total">
              <span>Total estimado · {noches} {noches === 1 ? "noche" : "noches"}</span>
              <strong>{formatearPesos(totalEstadia)}</strong>
              <small>Tarifa de $65.000 por persona.</small>
            </div>
          </section>

          {errorReserva && <p className="reservation-create-error" role="alert">{errorReserva}</p>}
          <footer className="reservation-create-footer">
            <button type="button" className="reservation-create-secondary" onClick={onClose} disabled={enviandoPago}>
              Cancelar
            </button>
            <button
              type="submit"
              className="reservation-create-submit"
              disabled={
                enviandoPago || !idCliente || !fechaEntrada || !fechaSalida || !tipoHabitacion
                || !idHabitacion || !porcentajePago || !noches || cargandoHabitaciones
              }
            >
              <i className={`fa-solid ${enviandoPago ? "fa-spinner fa-spin" : "fa-lock"}`} aria-hidden="true" />
              {enviandoPago ? "Conectando con Wompi…" : `Continuar al pago · ${formatearPesos(pagoAhora)}`}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default ReservaRecepcionModal;
