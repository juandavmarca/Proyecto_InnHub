import { useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { crearCaracteristica, eliminarCaracteristica, obtenerCaracteristicas, obtenerHabitaciones } from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";

function HabitacionCaracteristicas() {
  const [searchParams] = useSearchParams();
  const idHabitacion = searchParams.get("id_habitacion");
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState({ type: "", text: "" });
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
  const [caracteristicaAEliminar, setCaracteristicaAEliminar] = useState(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", habitaciones_id_habitacion: idHabitacion || "" });

  useEffect(() => {
    if (!idHabitacion) {
      setCaracteristicas([]);
      setHabitacionSeleccionada(null);
      setLoading(false);
      return;
    }

    const cargarDatos = async () => {
      setLoading(true);
      try {
        const habitaciones = await obtenerHabitaciones();
        const habitacion = habitaciones.find((item) => String(item.id_habitacion) === String(idHabitacion));
        setHabitacionSeleccionada(habitacion || null);
        setForm((prev) => ({ ...prev, habitaciones_id_habitacion: idHabitacion }));

        const data = await obtenerCaracteristicas(idHabitacion);
        setCaracteristicas(data);
      } catch (error) {
        console.error(error);
        setCaracteristicas([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [idHabitacion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ nombre: "", descripcion: "", habitaciones_id_habitacion: idHabitacion || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idHabitacion) {
      setMensaje({ type: "error", text: "Primero debes seleccionar una habitación." });
      return;
    }

    if (!form.nombre.trim() || !form.descripcion.trim()) {
      setMensaje({ type: "error", text: "Completa nombre y descripción." });
      return;
    }

    setSaving(true);
    setMensaje({ type: "", text: "" });

    try {
      const res = await crearCaracteristica({
        ...form,
        habitaciones_id_habitacion: Number(idHabitacion),
      });

      if (!res.success) {
        setMensaje({ type: "error", text: res.message || "No se pudo guardar la característica." });
        return;
      }

      setMensaje({ type: "success", text: res.message || "Característica registrada correctamente." });
      resetForm();
      setCaracteristicas(await obtenerCaracteristicas(idHabitacion));
    } catch (error) {
      console.error(error);
      setMensaje({ type: "error", text: "Error al guardar la característica." });
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminacion = (caracteristica) => {
    setCaracteristicaAEliminar(caracteristica);
  };

  const handleDelete = async () => {
    if (!caracteristicaAEliminar) return;

    try {
      const res = await eliminarCaracteristica(caracteristicaAEliminar.idcarac);
      if (!res.success) {
        setMensaje({ type: "error", text: res.message || "No se pudo eliminar la característica." });
        setCaracteristicaAEliminar(null);
        return;
      }

      setCaracteristicas((prev) => prev.filter((item) => item.idcarac !== caracteristicaAEliminar.idcarac));
      setMensaje({ type: "success", text: res.message || "Característica eliminada correctamente." });
      setCaracteristicaAEliminar(null);
    } catch (error) {
      console.error(error);
      setMensaje({ type: "error", text: "Error al eliminar la característica." });
      setCaracteristicaAEliminar(null);
    }
  };

  return (
    <div className="dashboard-page settings-page">
      <div className="dashboard-page-header settings-page-header">
        <div>
          <h1>Características</h1>
          <p className="settings-subtitle">Gestión de características por habitación</p>
        </div>
        <NavLink to="/Habitaciones" className="btn btn-secondary">
          Regresar a habitaciones
        </NavLink>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h2>Registrar característica</h2>
        </div>

        {!idHabitacion ? (
          <div className="disabled-empty-state">Debes abrir esta pantalla desde una habitación para registrar características.</div>
        ) : (
          <form onSubmit={handleSubmit} className="row g-3 align-items-end camas-form">
            <div className="col-md-4 camas-field">
              <label className="form-label text-light">Nombre</label>
              <input type="text" className="form-control camas-input" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. Wi‑Fi" />
            </div>

            <div className="col-md-5 camas-field">
              <label className="form-label text-light">Descripción</label>
              <input type="text" className="form-control camas-input" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Ej. Internet de alta velocidad" />
            </div>

            <div className="col-md-2 camas-field">
              <label className="form-label text-light">Habitación</label>
              <input type="text" className="form-control camas-input" value={habitacionSeleccionada ? `${habitacionSeleccionada.numero} - ${habitacionSeleccionada.tipo}` : idHabitacion} readOnly />
            </div>

            <div className="col-md-1 camas-field camas-submit-field">
              <button type="submit" className="btn btn-warning w-100 camas-submit-btn" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
            </div>

            {mensaje.text && (
              <div className="col-12">
                <div className={`alert ${mensaje.type === "success" ? "alert-success" : "alert-danger"}`}>{mensaje.text}</div>
              </div>
            )}
          </form>
        )}
      </div>

      <div className="settings-card mt-4">
        <div className="settings-card-header">
          <h2>Listado de características</h2>
        </div>

        {!idHabitacion ? (
          <div className="disabled-empty-state">No hay habitación seleccionada.</div>
        ) : loading ? (
          <div className="disabled-empty-state">Cargando características...</div>
        ) : caracteristicas.length === 0 ? (
          <div className="disabled-empty-state">Aún no hay características para esta habitación.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-striped align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {caracteristicas.map((item, index) => (
                  <tr key={item.idcarac}>
                    <td>{index + 1}</td>
                    <td>{item.nombre}</td>
                    <td>{item.descripcion}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => confirmarEliminacion(item)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        show={Boolean(caracteristicaAEliminar)}
        title="Confirmar eliminación"
        message={caracteristicaAEliminar ? `¿Está seguro de eliminar la característica ${caracteristicaAEliminar.nombre}?` : "¿Está seguro de eliminar esta característica?"}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setCaracteristicaAEliminar(null)}
      />
    </div>
  );
}

export default HabitacionCaracteristicas;
