import { useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { crearImagen, eliminarImagen, obtenerHabitaciones, obtenerImagenes } from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";

function HabitacionImagenes() {
  const [searchParams] = useSearchParams();
  const idHabitacion = searchParams.get("id_habitacion");
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState({ type: "", text: "" });
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);
  const [imagenAEliminar, setImagenAEliminar] = useState(null);
  const [form, setForm] = useState({ imagenArchivo: null, habitaciones_id_habitacion: idHabitacion || "" });

  useEffect(() => {
    if (!idHabitacion) {
      setImagenes([]);
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

        const data = await obtenerImagenes(idHabitacion);
        setImagenes(data);
      } catch (error) {
        console.error(error);
        setImagenes([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [idHabitacion]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagenArchivo") {
      setForm((prev) => ({ ...prev, imagenArchivo: files && files[0] ? files[0] : null }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ imagenArchivo: null, habitaciones_id_habitacion: idHabitacion || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idHabitacion) {
      setMensaje({ type: "error", text: "Primero debes seleccionar una habitación." });
      return;
    }

    if (!form.imagenArchivo) {
      setMensaje({ type: "error", text: "Debes seleccionar una imagen para subir." });
      return;
    }

    setSaving(true);
    setMensaje({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("habitaciones_id_habitacion", String(Number(idHabitacion)));
      formData.append("imagen", form.imagenArchivo);

      const res = await crearImagen(formData);

      if (!res.success) {
        setMensaje({ type: "error", text: res.message || "No se pudo guardar la imagen." });
        return;
      }

      setMensaje({ type: "success", text: res.message || "Imagen registrada correctamente." });
      resetForm();
      setImagenes(await obtenerImagenes(idHabitacion));
    } catch (error) {
      console.error(error);
      setMensaje({ type: "error", text: "Error al guardar la imagen." });
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminacion = (imagen) => {
    setImagenAEliminar(imagen);
  };

  const handleDelete = async () => {
    if (!imagenAEliminar) return;

    try {
      const res = await eliminarImagen(imagenAEliminar.id);
      if (!res.success) {
        setMensaje({ type: "error", text: res.message || "No se pudo eliminar la imagen." });
        setImagenAEliminar(null);
        return;
      }

      setImagenes((prev) => prev.filter((item) => item.id !== imagenAEliminar.id));
      setMensaje({ type: "success", text: res.message || "Imagen eliminada correctamente." });
      setImagenAEliminar(null);
    } catch (error) {
      console.error(error);
      setMensaje({ type: "error", text: "Error al eliminar la imagen." });
      setImagenAEliminar(null);
    }
  };

  return (
    <div className="dashboard-page settings-page">
      <div className="dashboard-page-header settings-page-header">
        <div>
          <h1>Imágenes</h1>
          <p className="settings-subtitle">Gestión de imágenes por habitación</p>
        </div>
        <NavLink to="/Habitaciones" className="btn btn-secondary">
          Regresar a habitaciones
        </NavLink>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h2>Registrar imagen</h2>
        </div>

        {!idHabitacion ? (
          <div className="disabled-empty-state">Debes abrir esta pantalla desde una habitación para registrar imágenes.</div>
        ) : (
          <form onSubmit={handleSubmit} className="row g-3 align-items-end camas-form">
            <div className="col-md-8 camas-field">
              <label className="form-label text-light">Archivo de la imagen</label>
              <input
                type="file"
                className="form-control camas-input"
                name="imagenArchivo"
                accept="image/*"
                onChange={handleChange}
              />
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
          <h2>Listado de imágenes</h2>
        </div>

        {!idHabitacion ? (
          <div className="disabled-empty-state">No hay habitación seleccionada.</div>
        ) : loading ? (
          <div className="disabled-empty-state">Cargando imágenes...</div>
        ) : imagenes.length === 0 ? (
          <div className="disabled-empty-state">Aún no hay imágenes para esta habitación.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-striped align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Imagen</th>
                  <th>URL</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {imagenes.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <img src={item.url} alt={`Imagen ${index + 1}`} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8 }} />
                    </td>
                    <td style={{ maxWidth: 440, wordBreak: "break-all" }}>{item.url}</td>
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
        show={Boolean(imagenAEliminar)}
        title="Confirmar eliminación"
        message={imagenAEliminar ? `¿Está seguro de eliminar esta imagen?` : "¿Está seguro de eliminar esta imagen?"}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setImagenAEliminar(null)}
      />
    </div>
  );
}

export default HabitacionImagenes;
