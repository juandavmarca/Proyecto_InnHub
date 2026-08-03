import { useState, useEffect } from "react";
import { crearCliente, editarCliente } from "../services/api";

const logo = "http://localhost/ERPInnHub/backend/uploads/logos.png";

function ClienteModal({ onClienteCreado, clienteEditar }) {
  const [form, setForm] = useState({
    documento: "",
    nombre: "",
    apellido: "",
    tipo_documento: "",
    telefono: "",
    email: "",
    ciudad_re: "",
  });
  const [formOriginal, setFormOriginal] = useState({
    documento: "",
    nombre: "",
    apellido: "",
    tipo_documento: "",
    telefono: "",
    email: "",
    ciudad_re: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (clienteEditar) {
      setForm(clienteEditar);
      setFormOriginal(clienteEditar);
      setIsEditing(true);
    } else {
      setForm({
        documento: "",
        nombre: "",
        apellido: "",
        tipo_documento: "",
        telefono: "",
        email: "",
        ciudad_re: "",
      });
      setFormOriginal({
        documento: "",
        nombre: "",
        apellido: "",
        tipo_documento: "",
        telefono: "",
        email: "",
        ciudad_re: "",
      });
      setIsEditing(false);
    }
    setError(null);
    setSuccess(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [clienteEditar]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const verificarCambios = () => {
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

    let res;
    if (isEditing) {
      res = await editarCliente(form);
    } else {
      res = await crearCliente(form);
    }

    if (!res.success) {
      setError(res.message);
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(res.message || (isEditing ? "Actualizado correctamente" : "Cliente creado correctamente"));
    setTimeout(() => {
      setSuccess(null);
      onClienteCreado();
      document.getElementById("cerrarModalCliente").click();
    }, 1500);
  };

  return (
    <div className="modal fade" id="clienteModal">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" id="cerrarModalCliente"></button>
          </div>
          <div className="modal-body">
            <div className="modal-form-brand">
              <img src={logo} alt="InnHub Logo" className="modal-brand-logo" />
              <div className="modal-form-brand-copy">
                <span>InnHub</span>
                <small>{isEditing ? "Actualiza los datos del cliente" : "Registra clientes con estilo"}</small>
              </div>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form-section">
              <div className="row">
                {/* Columna 1: Información Básica */}
                <div className="col-md-6">
                  <h6 className="mb-3"><strong>Información Básica</strong></h6>
                  <div className="form-group-icon">
                    <i className="fas fa-file"></i>
                    <input className="form-control mb-2" placeholder="Tipo Documento" name="tipo_documento" value={form.tipo_documento} onChange={handleChange} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-id-card"></i>
                    <input className="form-control mb-2" placeholder="Documento" name="documento" value={form.documento} onChange={handleChange} disabled={isEditing} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-user"></i>
                    <input className="form-control mb-2" placeholder="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-user"></i>
                    <input className="form-control mb-2" placeholder="Apellidos" name="apellido" value={form.apellido} onChange={handleChange} />
                  </div>
                </div>

                {/* Columna 2: Información de Contacto */}
                <div className="col-md-6">
                  <h6 className="mb-3"><strong>Información de Contacto</strong></h6>
                  <div className="form-group-icon">
                    <i className="fas fa-phone"></i>
                    <input className="form-control mb-2" placeholder="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-envelope"></i>
                    <input className="form-control mb-2" placeholder="Email" name="email" value={form.email} onChange={handleChange} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-map-marker-alt"></i>
                    <input className="form-control mb-2" placeholder="Ciudad Residencia" name="ciudad_re" value={form.ciudad_re} onChange={handleChange} />
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

export default ClienteModal;