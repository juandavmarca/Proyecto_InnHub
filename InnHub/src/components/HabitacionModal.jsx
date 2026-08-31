import { useState, useEffect } from "react";
import { crearHabitacion, editarHabitacion } from "../services/api";

const logo = "http://localhost/ERPInnHub/backend/uploads/logo.png";
const ESTADO_HABITACION_OPTIONS = [
  "Disponible",
  "No disponible",
  "Ocupada",
  "Mantenimiento",
];

function HabitacionModal({ onHabitacionCreado, onSuccess, habitacionEditar }) {
  const [form, setForm] = useState({
    numero: "",
    tipo: "",
    precio_noche: "",
    estado: "Disponible",
  });
  const [formOriginal, setFormOriginal] = useState({
    numero: "",
    tipo: "",
    precio_noche: "",
    estado: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (habitacionEditar) {
      setForm(habitacionEditar);
      setFormOriginal(habitacionEditar);
      setIsEditing(true);
    } else {
      setForm({
        numero: "",
        tipo: "",
        precio_noche: "",
        estado: "Disponible",
      });
      setFormOriginal({
        numero: "",
        tipo: "",
        precio_noche: "",
        estado: "Disponible",
      });
      setIsEditing(false);
    }
    setError(null);
    setSuccess(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [habitacionEditar]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const verificarCambios = () => {
    return JSON.stringify(form) !== JSON.stringify(formOriginal);
  };

  const handleSubmit = async () => {
    // Validaciones frontend
    if (!form.numero.trim()) {
      setError("El numero es obligatorio");
      return;
    }

    if (isEditing && !verificarCambios()) {
      setError("No hiciste ningún cambio");
      setSuccess(null);
      return;
    }

    let res;
    if (isEditing) {
      res = await editarHabitacion(form);
    } else {
      res = await crearHabitacion(form);
    }

    if (!res.success) {
      setError(res.message);
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(res.message || (isEditing ? "Actualizado correctamente" : "Habitación creada correctamente"));
    onSuccess?.(res.message || (isEditing ? "Habitación actualizada correctamente" : "Habitación registrada correctamente"));
    setTimeout(() => {
      setSuccess(null);
      onHabitacionCreado();
      document.getElementById("cerrarModalHabitacion").click();
    }, 1500);
  };

  return (
    <div className="modal fade" id="habitacionModal">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEditing ? "Editar Habitación" : "Nueva Habitación"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" id="cerrarModalHabitacion"></button>
          </div>
          <div className="modal-body">
            <div className="modal-form-brand">
              <img src={logo} alt="Hotel Valencia Logo" className="modal-brand-logo" />
              <div className="modal-form-brand-copy">
                <span>Hotel Valencia</span>
                <small>{isEditing ? "Editar habitación" : "Nueva habitación"}</small>
              </div>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <div className="form-section">
              <div className="form-group-icon">
              <i className="fas fa-door-open"></i>
              <input className="form-control mb-2" placeholder="Número Habitación" name="numero" value={form.numero} onChange={handleChange} />
            </div>
            <div className="form-group-icon">
              <i className="fas fa-star"></i>
              <input className="form-control mb-2" placeholder="Tipo" name="tipo" value={form.tipo} onChange={handleChange} />
            </div>
            <div className="form-group-icon">
              <i className="fas fa-money-bill-wave"></i>
              <input className="form-control mb-2" placeholder="Precio Noche" name="precio_noche" value={form.precio_noche} onChange={handleChange} />
            </div>
            <div className="form-group-icon">
              <i className="fas fa-check-circle"></i>
              <select className="form-select mb-2" name="estado" value={form.estado} onChange={handleChange}>
                <option value="" disabled>Selecciona un estado</option>
                {ESTADO_HABITACION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit}>{isEditing ? "Actualizar" : "Guardar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HabitacionModal;