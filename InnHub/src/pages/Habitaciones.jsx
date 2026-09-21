import HabitacionModal from "../components/HabitacionModal";
import {
  obtenerHabitaciones,
  actualizarEstadoHabitacion,
  obtenerCamas,
  obtenerCaracteristicas,
  obtenerImagenes,
} from "../services/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import CenteredToast from "../components/CenteredToast";

const getHabitacionStatus = (habitacion) => {
  const estado = String(habitacion.estado || "").toLowerCase();
  if (estado.includes("no disponible")) return "no-disponible";
  if (estado.includes("ocupada")) return "ocupada";
  if (estado.includes("mantenimiento")) return "mantenimiento";
  if (estado.includes("disponible")) return "disponible";
  return "sin-estado";
};

const imagenesHabitacionDemo = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
];

function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [habitacionEditar, setHabitacionEditar] = useState(null);
  const [camasPorHabitacion, setCamasPorHabitacion] = useState({});
  const [detalleHabitacion, setDetalleHabitacion] = useState(null);
  const [detalleImagenes, setDetalleImagenes] = useState([]);
  const [detalleCamas, setDetalleCamas] = useState([]);
  const [detalleCaracteristicas, setDetalleCaracteristicas] = useState([]);
  const [detalleIndex, setDetalleIndex] = useState(0);
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  useEffect(() => {
    const cargarHabitaciones = async () => {
      const data = await obtenerHabitaciones();
      const enriched = data.map((habitacion) => ({
        ...habitacion,
        statusCategory: getHabitacionStatus(habitacion),
      }));
      setHabitaciones(enriched);

      const camas = await obtenerCamas();
      const conteo = {};
      camas.forEach((cama) => {
        const idHabitacion = String(cama.habitaciones_id_habitacion);
        conteo[idHabitacion] = (conteo[idHabitacion] || 0) + Number(cama.cantidad || 0);
      });
      setCamasPorHabitacion(conteo);
      setLoading(false);
    };

    cargarHabitaciones();
  }, []);

  const handleEditarHabitacion = (habitacion) => {
    setHabitacionEditar(habitacion);
  };

  const handleNuevaHabitacion = () => {
    setHabitacionEditar(null);
  };

  const abrirDetalleHabitacion = async (habitacion) => {
    setDetalleHabitacion(habitacion);
    setDetalleIndex(0);

    try {
      const [imagenes, camas, caracteristicas] = await Promise.all([
        obtenerImagenes(habitacion.id_habitacion),
        obtenerCamas(habitacion.id_habitacion),
        obtenerCaracteristicas(habitacion.id_habitacion),
      ]);

      setDetalleImagenes(Array.isArray(imagenes) ? imagenes : []);
      setDetalleCamas(Array.isArray(camas) ? camas : []);
      setDetalleCaracteristicas(Array.isArray(caracteristicas) ? caracteristicas : []);
    } catch (error) {
      console.error("Error cargando detalle de habitación:", error);
      setDetalleImagenes([]);
      setDetalleCamas([]);
      setDetalleCaracteristicas([]);
    }
  };

  const cerrarDetalleHabitacion = () => {
    setDetalleHabitacion(null);
    setDetalleImagenes([]);
    setDetalleCamas([]);
    setDetalleCaracteristicas([]);
    setDetalleIndex(0);
  };

  const imagenesRegistradas = detalleImagenes
    .filter((img) => img && img.url)
    .map((img) => img.url);
  const imagenesDetalle = imagenesRegistradas.length > 0 ? imagenesRegistradas : imagenesHabitacionDemo;

  const imagenActiva = imagenesDetalle[detalleIndex] || imagenesDetalle[0];

  const handleDeshabilitarHabitacion = async (habitacion) => {
    setConfirm({
      show: true,
      title: "Deshabilitar habitación",
      message: `¿Está seguro que desea deshabilitar la habitación ${habitacion.numero}?`,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, show: false }));
        try {
          const res = await actualizarEstadoHabitacion(habitacion.id_habitacion, "No disponible");
          if (!res.success) {
            setToast({ show: true, message: res.message || "No se pudo deshabilitar la habitación", type: "error" });
            return;
          }
          setHabitaciones((prev) =>
            prev.map((item) =>
              item.id_habitacion === habitacion.id_habitacion
                ? { ...item, estado: "No disponible", statusCategory: "no-disponible" }
                : item
            )
          );
          setToast({ show: true, message: `Habitación ${habitacion.numero} deshabilitada correctamente`, type: "success" });
        } catch (error) {
          console.error(error);
          setToast({ show: true, message: "Error al actualizar el estado de la habitación", type: "error" });
        }
      },
    });
  };

  const handleHabilitarHabitacion = async (habitacion) => {
    setConfirm({
      show: true,
      title: "Habilitar habitación",
      message: `¿Está seguro que desea habilitar la habitación ${habitacion.numero}?`,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, show: false }));
        try {
          const res = await actualizarEstadoHabitacion(habitacion.id_habitacion, "Disponible");
          if (!res.success) {
            setToast({ show: true, message: res.message || "No se pudo habilitar la habitación", type: "error" });
            return;
          }
          setHabitaciones((prev) =>
            prev.map((item) =>
              item.id_habitacion === habitacion.id_habitacion
                ? { ...item, estado: "Disponible", statusCategory: "disponible" }
                : item
            )
          );
          setToast({ show: true, message: `Habitación ${habitacion.numero} habilitada correctamente`, type: "success" });
        } catch (error) {
          console.error(error);
          setToast({ show: true, message: "Error al actualizar el estado de la habitación", type: "error" });
        }
      },
    });
  };

  const habitacionesFiltradas = habitaciones.filter((habitacion) => habitacion.statusCategory !== "no-disponible");

  if (loading) {
    return <div className="alert alert-info">Cargando habitaciones...</div>;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center dashboard-page-header">
        <h2 className="dashboard-title-gold">Habitaciones</h2>
        <div>
          <button className="btn btn-success" data-bs-toggle="modal" data-bs-target="#habitacionModal" onClick={handleNuevaHabitacion}>
            + Nueva Habitacion
          </button>
        </div>
      </div>

      <HabitacionModal
        habitacionEditar={habitacionEditar}
        onSuccess={(message) => setToast({ show: true, message, type: "success" })}
        onHabitacionCreado={() => {
          setLoading(true);
          obtenerHabitaciones().then((data) => {
            const enriched = data.map((habitacion) => ({
              ...habitacion,
              statusCategory: getHabitacionStatus(habitacion),
            }));
            setHabitaciones(enriched);
            setLoading(false);
            setHabitacionEditar(null);
          });
        }}
      />
      {/* tabla de habitaciones*/}
      <div className="dashboard-table-card mt-3">
        <table className="table table-striped table-innhub habitaciones-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Tipo</th>
            <th>Precio Noche</th>
            <th>Camas</th>
            <th>Ver</th>
            <th>Estado</th>
            <th>Especificaciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {habitacionesFiltradas.map((habitacion) => {
            const statusText = habitacion.estado || "Sin estado";
            const statusClass = habitacion.statusCategory || "sin-estado";
            const camas = Number(camasPorHabitacion[String(habitacion.id_habitacion)] ?? 0) || 0;

            return (
              <tr key={habitacion.id_habitacion} className={`habitacion-row ${statusClass}`}>
                <td>{habitacion.numero}</td>
                <td>{habitacion.tipo}</td>
                <td>{habitacion.precio_noche}</td>
                <td>
                  <div className="habitacion-meta-cell habitacion-meta-counter" title="Número de camas">
                    <i className="fas fa-bed habitacion-meta-icon"></i>
                    <span>{camas}</span>
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="habitacion-meta-cell habitacion-meta-link"
                    title="Ver detalles"
                    onClick={() => abrirDetalleHabitacion(habitacion)}
                  >
                    <i className="fas fa-eye habitacion-meta-icon"></i>
                    <span>Ver</span>
                  </button>
                </td>
                <td>
                  <span className={`estado-badge ${statusClass}`}>
                    <span className="estado-dot" />
                    {statusText}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2 flex-wrap align-items-center justify-content-center">
                    <Link
                      to={`/HabitacionCamas?id_habitacion=${habitacion.id_habitacion}`}
                      className="btn btn-sm foreign-action-btn foreign-action-btn--camas"
                      title="Gestionar camas"
                      aria-label="Gestionar camas"
                    >
                      <i className="fa-solid fa-bed"></i>
                    </Link>
                    <Link
                      to={`/HabitacionCaracteristicas?id_habitacion=${habitacion.id_habitacion}`}
                      className="btn btn-sm foreign-action-btn foreign-action-btn--caracteristicas"
                      title="Gestionar características"
                      aria-label="Gestionar características"
                    >
                      <i className="fa-solid fa-list-check"></i>
                    </Link>
                    <Link
                      to={`/HabitacionImagenes?id_habitacion=${habitacion.id_habitacion}`}
                      className="btn btn-sm foreign-action-btn foreign-action-btn--imagenes"
                      title="Gestionar imágenes"
                      aria-label="Gestionar imágenes"
                    >
                      <i className="fa-regular fa-images"></i>
                    </Link>
                  </div>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm" style={{backgroundColor: '#c89629', color: '#090808', border: 'none'}} data-bs-toggle="modal" data-bs-target="#habitacionModal" onClick={() => handleEditarHabitacion(habitacion)} title="Editar">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button className="btn btn-sm" style={{backgroundColor: '#8c1f1f', color: 'white', border: 'none'}} onClick={() => handleDeshabilitarHabitacion(habitacion)} title="Deshabilitar">
                      <i className="fa-solid fa-ban"></i>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      {detalleHabitacion && (
        <div className="modal-backdrop modal-backdrop-show" onClick={cerrarDetalleHabitacion}>
          <div className="room-detail-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close room-detail-close" type="button" onClick={cerrarDetalleHabitacion}>
              ×
            </button>

            <div className="room-detail-layout">
              <div className="room-detail-gallery">
                <div
                  className="room-detail-main-image"
                  style={{ backgroundImage: `url(${imagenActiva})` }}
                >
                  {imagenesDetalle.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="room-detail-arrow room-detail-arrow-left"
                        onClick={() => setDetalleIndex((prev) => (prev === 0 ? imagenesDetalle.length - 1 : prev - 1))}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="room-detail-arrow room-detail-arrow-right"
                        onClick={() => setDetalleIndex((prev) => (prev === imagenesDetalle.length - 1 ? 0 : prev + 1))}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {imagenesDetalle.length > 1 && (
                  <div className="room-detail-thumbs">
                    {imagenesDetalle.map((imagen, index) => (
                      <button
                        key={`${imagen}-${index}`}
                        type="button"
                        className={`room-detail-thumb ${detalleIndex === index ? "active" : ""}`}
                        style={{ backgroundImage: `url(${imagen})` }}
                        onClick={() => setDetalleIndex(index)}
                        aria-label={`Ver imagen ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="room-detail-content">
                <div className="room-detail-header">
                  <h2>{detalleHabitacion.tipo || "Habitación"} {detalleHabitacion.numero || ""}</h2>
                  <span className="room-detail-status">{detalleHabitacion.estado || "Disponible"}</span>
                </div>

                <p className="room-detail-description">
                  Espacio amplio y elegante, pensado para quienes buscan confort, exclusividad y una experiencia relajante en cada detalle.
                </p>

                <p className="room-detail-price">
                  ${Number(detalleHabitacion.precio_noche || 0).toLocaleString("es-CO")} COP / noche
                </p>

                <div className="room-detail-info-grid">
                  <div className="room-detail-info-item">
                    <i className="fa-solid fa-bed"></i>
                    <div>
                      <span>Camas</span>
                      <strong>{detalleCamas.length ? detalleCamas.reduce((total, cama) => total + Number(cama.cantidad || 0), 0) : 0}</strong>
                    </div>
                  </div>

                  <div className="room-detail-info-item">
                    <i className="fa-solid fa-list-check"></i>
                    <div>
                      <span>Características</span>
                      <strong>{detalleCaracteristicas.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="room-detail-section">
                  <h3>Características</h3>
                  <div className="room-detail-chip-list">
                    {detalleCaracteristicas.length > 0 ? (
                      detalleCaracteristicas.map((caracteristica, index) => (
                        <div key={`${caracteristica.idcarac || index}`} className="room-detail-chip">
                          <i className="fa-regular fa-circle-check"></i>
                          <strong className="room-detail-feature-name">{caracteristica.nombre}</strong>
                        </div>
                      ))
                    ) : (
                      <span className="room-detail-empty">Aún no hay características registradas.</span>
                    )}
                  </div>
                </div>

                <div className="room-detail-section">
                  <h3>Camas</h3>
                  <div className="room-detail-bed-list">
                    {detalleCamas.length > 0 ? (
                      detalleCamas.map((cama, index) => (
                        <div key={`${cama.idCamas || index}`} className="room-detail-bed-item">
                          <span className="room-detail-bed-name">{cama.tipo}</span>
                          <span className="room-detail-bed-meta">{cama.tamano} • {cama.cantidad} unidad(es)</span>
                        </div>
                      ))
                    ) : (
                      <span className="room-detail-empty">No hay camas registradas para esta habitación.</span>
                    )}
                  </div>
                </div>

                <button type="button" className="btn btn-secondary room-detail-button" onClick={cerrarDetalleHabitacion}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={confirm.show}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => confirm.onConfirm && confirm.onConfirm()}
        onCancel={() => setConfirm((c) => ({ ...c, show: false }))}
      />
      <CenteredToast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}

export default Habitaciones;