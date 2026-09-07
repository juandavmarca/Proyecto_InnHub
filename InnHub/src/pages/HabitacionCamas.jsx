import { useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { crearCama, eliminarCama, obtenerCamas, obtenerHabitaciones } from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";

function HabitacionCamas() {
  const [searchParams] = useSearchParams();
  const idHabitacion = searchParams.get("id_habitacion");
  const [camas, setCamas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState({ type: "", text: "" });
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
  const [camaAEliminar, setCamaAEliminar] = useState(null);
  const [form, setForm] = useState({
    tipo: "",
    precio_noche: "",
    tamano: "",
    cantidad: "",
    habitaciones_id_habitacion: idHabitacion || "",
  });

  useEffect(() => {
    if (!idHabitacion) {
      setCamas([]);
      setHabitacionSeleccionada(null);
      setLoading(false);
      return;
    }

    const cargarHabitacionYcamas = async () => {
      setLoading(true);
      try {
        const habitaciones = await obtenerHabitaciones();
        const habitacion = habitaciones.find((item) => String(item.id_habitacion) === String(idHabitacion));
        setHabitacionSeleccionada(habitacion || null);

        setForm((prev) => ({
          ...prev,
          habitaciones_id_habitacion: idHabitacion,
          tipo: prev.tipo || (habitacion?.tipo || ""),
          precio_noche: prev.precio_noche || (habitacion?.precio_noche ?? ""),
        }));

        const data = await obtenerCamas(idHabitacion);
        setCamas(data);
      } catch (error) {
        console.error(error);
        setCamas([]);
      } finally {
        setLoading(false);
      }
    };

    cargarHabitacionYcamas();
  }, [idHabitacion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      tipo: habitacionSeleccionada?.tipo || "",
      precio_noche: habitacionSeleccionada?.precio_noche ?? "",
      tamano: "",
      cantidad: "",
      habitaciones_id_habitacion: idHabitacion || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idHabitacion) {
      setMensaje({ type: "error", text: "Primero debes seleccionar una habitación." });
      return;
    }

    if (!form.tipo.trim() || !form.tamano.trim() || !form.cantidad) {
      setMensaje({ type: "error", text: "Completa tipo, tamaño y cantidad." });
      return;
    }

    setSaving(true);
    setMensaje({ type: "", text: "" });

    try {
      const { precio_noche, ...payload } = form;
      const res = await crearCama({
        ...payload,
        cantidad: Number(form.cantidad),
        habitaciones_id_habitacion: Number(idHabitacion),
      });

      if (!res.success) {
        setMensaje({ type: "error", text: res.message || "No se pudo guardar la cama." });
        return;
      }

      setMensaje({ type: "success", text: res.message || "Cama registrada correctamente." });
      resetForm();

      const nuevasCamas = await obtenerCamas(idHabitacion);
      setCamas(nuevasCamas);
    } catch (error) {
      console.error(error);
      setMensaje({ type: "error", text: "Error al guardar la cama." });
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminacion = (cama) => {
    setCamaAEliminar(cama);
  };

  const handleDelete = async () => {
    if (!camaAEliminar) return;

    try {
      const res = await eliminarCama(camaAEliminar.idCamas);
      if (!res.success) {
        setMensaje({ type: "error", text: res.message || "No se pudo eliminar la cama." });
        setCamaAEliminar(null);
        return;
      }

      setCamas((prev) => prev.filter((cama) => cama.idCamas !== camaAEliminar.idCamas));
      setMensaje({ type: "success", text: res.message || "Cama eliminada correctamente." });
      setCamaAEliminar(null);
    } catch (error) {
      console.error(error);
      setMensaje({ type: "error", text: "Error al eliminar la cama." });
      setCamaAEliminar(null);
    }
  };

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
          <h2>Registrar cama</h2>
        </div>

        {!idHabitacion ? (
          <div className="disabled-empty-state">
            Debes abrir esta pantalla desde una habitación para registrar camas.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="row g-3 align-items-end camas-form">
            <div className="col-md-2 camas-field">
              <label className="form-label text-light">Tipo</label>
              <input
                type="text"
                className="form-control camas-input"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                placeholder="Ej. Queen"
                readOnly={Boolean(habitacionSeleccionada?.tipo)}
              />
            </div>

            <div className="col-md-2 camas-field">
              <label className="form-label text-light">Precio</label>
              <input
                type="text"
                className="form-control camas-input"
                name="precio_noche"
                value={form.precio_noche}
                readOnly
              />
            </div>

            <div className="col-md-2 camas-field">
              <label className="form-label text-light">Tamaño</label>
              <input
                type="text"
                className="form-control camas-input"
                name="tamano"
                value={form.tamano}
                onChange={handleChange}
                placeholder="Ej. King"
              />
            </div>

            <div className="col-md-2 camas-field">
              <label className="form-label text-light">Cantidad</label>
              <input
                type="number"
                min="1"
                className="form-control camas-input"
                name="cantidad"
                value={form.cantidad}
                onChange={handleChange}
                placeholder="1"
              />
            </div>

            <div className="col-md-3 camas-field">
              <label className="form-label text-light">Habitación</label>
              <input
                type="text"
                className="form-control camas-input"
                value={habitacionSeleccionada ? `${habitacionSeleccionada.numero} - ${habitacionSeleccionada.tipo}` : idHabitacion}
                readOnly
              />
            </div>

            <div className="col-md-1 camas-field camas-submit-field">
              <button type="submit" className="btn btn-warning w-100 camas-submit-btn" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {mensaje.text && (
              <div className="col-12">
                <div className={`alert ${mensaje.type === "success" ? "alert-success" : "alert-danger"}`}>
                  {mensaje.text}
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      <div className="settings-card mt-4">
        <div className="settings-card-header">
          <h2>Listado de camas</h2>
        </div>

        {!idHabitacion ? (
          <div className="disabled-empty-state">No hay habitación seleccionada.</div>
        ) : loading ? (
          <div className="disabled-empty-state">Cargando camas...</div>
        ) : camas.length === 0 ? (
          <div className="disabled-empty-state">Aún no hay camas registradas para esta habitación.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-striped align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tipo</th>
                  <th>Tamaño</th>
                  <th>Cantidad</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {camas.map((cama, index) => (
                  <tr key={cama.idCamas}>
                    <td>{index + 1}</td>
                    <td>{cama.tipo}</td>
                    <td>{cama.tamano}</td>
                    <td>{cama.cantidad}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => confirmarEliminacion(cama)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        show={Boolean(camaAEliminar)}
        title="Confirmar eliminación"
        message={camaAEliminar ? `¿Está seguro de eliminar la cama ${camaAEliminar.tipo}?` : "¿Está seguro de eliminar esta cama?"}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setCamaAEliminar(null)}
      />
    </div>
  );
}

export default HabitacionCamas;
