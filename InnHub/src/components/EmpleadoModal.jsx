import { useState, useEffect } from "react";
import { crearEmpleado, editarEmpleado } from "../services/api";

const logo = "http://localhost/ERPInnHub/backend/uploads/logovs.png";

function EmpleadoModal({ onEmpleadoCreado, onSuccess, empleadoEditar }) {
  const [form, setForm] = useState({
    documento: "",
    nombre: "",
    apellido: "",
    cargo: "",
    telefono: "",
    email: "",
  });
  const [formOriginal, setFormOriginal] = useState({
    documento: "",
    nombre: "",
    apellido: "",
    cargo: "",
    telefono: "",
    email: "",
  });
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (empleadoEditar) {
      setForm(empleadoEditar);
      setFormOriginal(empleadoEditar);
      setIsEditing(true);
      setFotoPerfil(null);
    } else {
      setForm({
        documento: "",
        nombre: "",
        apellido: "",
        cargo: "",
        telefono: "",
        email: "",
      });
      setFormOriginal({
        documento: "",
        nombre: "",
        apellido: "",
        cargo: "",
        telefono: "",
        email: "",
      });
      setFotoPerfil(null);
      setIsEditing(false);
    }
    setError(null);
    setSuccess(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [empleadoEditar]);

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;
    if (type === "file") {
      setFotoPerfil(files[0] ?? null);
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const verificarCambios = () => {
    if (fotoPerfil) return true; // Si hay nueva foto, hay cambios
    return JSON.stringify(form) !== JSON.stringify(formOriginal);
  };

  const handleSubmit = async () => {
    // Validaciones frontend
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    if (isEditing && !verificarCambios()) {
      setError("No hiciste ningún cambio");
      setSuccess(null);
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value ?? "");
    });
    if (fotoPerfil) formData.append("foto_perifl", fotoPerfil);

    let res;
    if (isEditing) {
      res = await editarEmpleado(formData);
    } else {
      res = await crearEmpleado(formData);
    }

    if (!res.success) {
      setError(res.message);
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(res.message || (isEditing ? "Actualizado correctamente" : "Empleado creado correctamente"));
    onSuccess?.(res.message || (isEditing ? "Empleado actualizado correctamente" : "Empleado registrado correctamente"));
    setTimeout(() => {
      setSuccess(null);
      setForm({
        documento: "",
        nombre: "",
        apellido: "",
        cargo: "",
        telefono: "",
        email: "",
      });
      setFotoPerfil(null);
      onEmpleadoCreado();
      document.getElementById("cerrarModalEmpleado").click();
    }, 1500);
  };

  return (
    <div className="modal fade" id="empleadoModal">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEditing ? "Editar Empleado" : "Nuevo Empleado"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" id="cerrarModalEmpleado"></button>
          </div>
          <div className="modal-body">
            <div className="modal-form-brand">
              <img src={logo} alt="Hotel Valencia Logo" className="modal-brand-logo" />
              <div className="modal-form-brand-copy">
                <span>Hotel Valencia</span>
                <small>{isEditing ? "Actualizar empleado" : "Nuevo empleado"}</small>
              </div>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <div className="form-section">
              <div className="row g-2">
                <div className="col-md-6">
                  <h6 className="mb-2"><strong>Información Básica</strong></h6>
                  <div className="form-group-icon">
                    <i className="fas fa-id-card"></i>
                    <input className="form-control" placeholder="Documento" name="documento" value={form.documento} onChange={handleChange} disabled={isEditing} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-user"></i>
                    <input className="form-control" placeholder="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-user"></i>
                    <input className="form-control" placeholder="Apellidos" name="apellido" value={form.apellido} onChange={handleChange} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-briefcase"></i>
                    <input className="form-control" placeholder="Cargo" name="cargo" value={form.cargo} onChange={handleChange} />
                  </div>
                </div>

                <div className="col-md-6">
                  <h6 className="mb-2"><strong>Información de Contacto</strong></h6>
                  <div className="form-group-icon">
                    <i className="fas fa-phone"></i>
                    <input className="form-control" placeholder="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-envelope"></i>
                    <input className="form-control" placeholder="Email" name="email" value={form.email} onChange={handleChange} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-camera"></i>
                    <input
                      type="file"
                      className="form-control"
                      name="foto_perifl"
                      accept="image/*"
                      onChange={handleChange}
                    />
                  </div>
                </div>
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

export default EmpleadoModal;