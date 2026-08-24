import HabitacionModal from "../components/HabitacionModal";
import { obtenerHabitaciones, actualizarEstadoHabitacion } from "../services/api";
import { useEffect, useState } from "react";
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

function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [habitacionEditar, setHabitacionEditar] = useState(null);
  const [mostrarDeshabilitados, setMostrarDeshabilitados] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  useEffect(() => {
    obtenerHabitaciones().then((data) => {
      const enriched = data.map((habitacion) => ({
        ...habitacion,
        statusCategory: getHabitacionStatus(habitacion),
      }));
      setHabitaciones(enriched);
      setLoading(false);
    });
  }, []);

  const handleEditarHabitacion = (habitacion) => {
    setHabitacionEditar(habitacion);
  };

  const handleNuevaHabitacion = () => {
    setHabitacionEditar(null);
    setMostrarDeshabilitados(false);
  };

  const handleVerDeshabilitados = () => {
    setMostrarDeshabilitados(true);
  };

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

  const habitacionesFiltradas = habitaciones.filter((habitacion) =>
    mostrarDeshabilitados
      ? habitacion.statusCategory === "no-disponible"
      : habitacion.statusCategory !== "no-disponible"
  );

  if (loading) {
    return <div className="alert alert-info">Cargando habitaciones...</div>;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Habitaciones</h2>
        <div>
          <button className="btn btn-success" data-bs-toggle="modal" data-bs-target="#habitacionModal" onClick={handleNuevaHabitacion}>
            + Nueva Habitacion
          </button>
          <button type="button" className="btn btn-secondary ms-2" onClick={handleVerDeshabilitados}>
            Deshabilitados
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
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {habitacionesFiltradas.map((habitacion) => {
            const statusText = habitacion.estado || "Sin estado";
            const statusClass = habitacion.statusCategory || "sin-estado";
            return (
              <tr key={habitacion.id_habitacion} className={`habitacion-row ${statusClass}`}>
                
                <td>{habitacion.numero}</td>
                <td>{habitacion.tipo}</td>
                <td>{habitacion.precio_noche}</td>
                <td>
                  <span className={`estado-badge ${statusClass}`}>
                    <span className="estado-dot" />
                    {statusText}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm" style={{backgroundColor: '#c89629', color: '#090808', border: 'none'}} data-bs-toggle="modal" data-bs-target="#habitacionModal" onClick={() => handleEditarHabitacion(habitacion)} title="Editar">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    {mostrarDeshabilitados ? (
                      <button className="btn btn-sm" style={{backgroundColor: '#1f1a17', color: '#c89629', border: '1px solid rgba(255,255,255,0.1)'}} onClick={() => handleHabilitarHabitacion(habitacion)} title="Habilitar">
                        <i className="fa-solid fa-check"></i>
                      </button>
                    ) : (
                      <button className="btn btn-sm" style={{backgroundColor: '#8c1f1f', color: 'white', border: 'none'}} onClick={() => handleDeshabilitarHabitacion(habitacion)} title="Deshabilitar">
                        <i className="fa-solid fa-ban"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
      {mostrarDeshabilitados && (
        <div className="mt-3">
          <button className="btn btn-secondary" onClick={() => setMostrarDeshabilitados(false)}>
            Regresar a tabla habitaciones
          </button>
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