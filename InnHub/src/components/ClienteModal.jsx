import { useState, useEffect } from "react";
import { crearCliente, editarCliente } from "../services/api";

const logo = "http://localhost/ERPInnHub/backend/uploads/logo.png";

const TIPO_DOCUMENTO_OPTIONS = [
  "Cédula de ciudadanía",
  "tarjeta de identidad",
  "cédula de extranjería",
  "pasaporte",
];

const CIUDAD_OPTIONS = [
  "Arauca",
  "Armenia",
  "Barranquilla",
  "Bogotá D.C.",
  "Bucaramanga",
  "Cali",
  "Cartagena",
  "Cúcuta",
  "Florencia",
  "Ibagué",
  "Leticia",
  "Manizales",
  "Medellín",
  "Mitú",
  "Mocoa",
  "Montería",
  "Neiva",
  "Pasto",
  "Pereira",
  "Popayán",
  "Puerto Carreño",
  "Quibdó",
  "Riohacha",
  "San Andrés",
  "San José del Guaviare",
  "Santa Marta",
  "Sincelejo",
  "Tunja",
  "Valledupar",
  "Villavicencio",
  "Yopal",
];

function ClienteModal({ onClienteCreado, onSuccess, clienteEditar }) {
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
  const [ciudadOtraOriginal, setCiudadOtraOriginal] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [ciudadOtra, setCiudadOtra] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (clienteEditar) {
      const clienteNormalizado = {
        ...clienteEditar,
        documento: clienteEditar.documento ?? "",
        tipo_documento: clienteEditar.tipo_documento ?? "",
        ciudad_re: clienteEditar.ciudad_re ?? "",
      };
      setForm(clienteNormalizado);
      setFormOriginal(clienteNormalizado);
      setCiudadOtra(
        clienteNormalizado.ciudad_re && !CIUDAD_OPTIONS.includes(clienteNormalizado.ciudad_re)
          ? clienteNormalizado.ciudad_re
          : ""
      );
      setCiudadOtraOriginal(
        clienteNormalizado.ciudad_re && !CIUDAD_OPTIONS.includes(clienteNormalizado.ciudad_re)
          ? clienteNormalizado.ciudad_re
          : ""
      );
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
      setCiudadOtra("");
      setCiudadOtraOriginal("");
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
    return JSON.stringify([form, ciudadOtra]) !== JSON.stringify([formOriginal, ciudadOtraOriginal]);
  };

  const esCiudadOtra = form.ciudad_re === "Otra"
    || (form.ciudad_re !== "" && !CIUDAD_OPTIONS.includes(form.ciudad_re));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isEditing && !verificarCambios()) {
      setError("No hiciste ningún cambio");
      setSuccess(null);
      return;
    }

    const ciudadResidencia = esCiudadOtra ? ciudadOtra.trim() : form.ciudad_re;
    if (esCiudadOtra && !ciudadResidencia) {
      setError("Escribe la ciudad de residencia");
      setSuccess(null);
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const datosCliente = { ...form, ciudad_re: ciudadResidencia };
      const res = isEditing
        ? await editarCliente(datosCliente)
        : await crearCliente(datosCliente);

      if (!res.success) {
        throw new Error(res.message || "No se pudo guardar el cliente.");
      }

      const mensaje = res.message || (isEditing ? "Cliente actualizado correctamente" : "Cliente registrado correctamente");
      setSuccess(mensaje);
      onSuccess?.(mensaje);
      window.setTimeout(() => {
        setSuccess(null);
        onClienteCreado();
        document.getElementById("cerrarModalCliente")?.click();
      }, 1200);
    } catch (submitError) {
      setError(submitError.message || "Ocurrió un error al guardar el cliente.");
      setSuccess(null);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal fade" id="clienteModal">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" id="cerrarModalCliente" disabled={guardando}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
            <div className="modal-form-brand">
              <img src={logo} alt="Hotel Valencia Logo" className="modal-brand-logo" />
              <div className="modal-form-brand-copy">
                <span>Hotel Valencia</span>
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
                    <select className="form-select mb-2" name="tipo_documento" value={form.tipo_documento} onChange={handleChange} disabled={guardando}>
                      <option value="">Seleccionar tipo de documento</option>
                      {TIPO_DOCUMENTO_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-id-card"></i>
                    <input type="number" className="form-control mb-2" placeholder="Documento" name="documento" value={form.documento} onChange={handleChange} disabled={isEditing || guardando} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-user"></i>
                    <input type="text" className="form-control mb-2" placeholder="Nombre" name="nombre" value={form.nombre} onChange={handleChange} maxLength={100} required disabled={guardando} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-user"></i>
                    <input type="text" className="form-control mb-2" placeholder="Apellidos" name="apellido" value={form.apellido} onChange={handleChange} maxLength={100} required disabled={guardando} />
                  </div>
                </div>

                {/* Columna 2: Información de Contacto */}
                <div className="col-md-6">
                  <h6 className="mb-3"><strong>Información de Contacto</strong></h6>
                  <div className="form-group-icon">
                    <i className="fas fa-phone"></i>
                    <input type="tel" className="form-control mb-2" placeholder="Teléfono" name="telefono" value={form.telefono} maxLength={20} onChange={handleChange} required disabled={guardando} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-envelope"></i>
                    <input type="email" className="form-control mb-2" placeholder="Email" name="email" value={form.email} onChange={handleChange} maxLength={100} required disabled={guardando} />
                  </div>
                  <div className="form-group-icon">
                    <i className="fas fa-map-marker-alt"></i>
                    <select
                      className="form-select mb-2"
                      name="ciudad_re"
                      value={esCiudadOtra ? "Otra" : form.ciudad_re}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm({ ...form, ciudad_re: value });
                        if (value !== "Otra") setCiudadOtra("");
                      }}
                      disabled={guardando}
                    >
                      <option value="">Seleccionar ciudad</option>
                      {CIUDAD_OPTIONS.map((ciudad) => (
                        <option key={ciudad} value={ciudad}>{ciudad}</option>
                      ))}
                      <option value="Otra">Otra ciudad</option>
                    </select>
                  </div>
                  {esCiudadOtra && (
                    <div className="form-group-icon">
                      <i className="fas fa-map-marker-alt"></i>
                      <input
                        className="form-control mb-2"
                        placeholder="Escribe la ciudad"
                        value={ciudadOtra}
                        onChange={(event) => setCiudadOtra(event.target.value)}
                        maxLength={45}
                        required
                        disabled={guardando}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? "Guardando…" : isEditing ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClienteModal;