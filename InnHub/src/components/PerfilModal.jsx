import { useEffect, useRef, useState } from "react";
import { actualizarPerfil, cambiarPassword } from "../services/api";

function PerfilAvatar({ usuario, nombre }) {
  const [imagenFallida, setImagenFallida] = useState(false);

  return (
    <div className="perfil-modal-avatar">
      {usuario.foto_perfil && !imagenFallida ? (
        <img
          src={usuario.foto_perfil}
          alt={`Foto de ${nombre || usuario.email}`}
          onError={() => setImagenFallida(true)}
        />
      ) : (
        <i className="fas fa-user" aria-hidden="true" />
      )}
    </div>
  );
}

function PerfilModal({ usuario, onClose, onUpdated }) {
  const [form, setForm] = useState({
    nombre: usuario.nombre || "",
    apellido: usuario.apellido || "",
    email: usuario.email || "",
    telefono: usuario.telefono || "",
  });
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(usuario.foto_perfil || "");
  const urlTemporalRef = useRef("");
  const [perfilError, setPerfilError] = useState("");
  const [perfilExito, setPerfilExito] = useState("");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => () => {
    if (urlTemporalRef.current) URL.revokeObjectURL(urlTemporalRef.current);
  }, []);

  const handlePhotoChange = (event) => {
    if (urlTemporalRef.current) URL.revokeObjectURL(urlTemporalRef.current);

    const archivo = event.target.files?.[0] ?? null;
    setFotoSeleccionada(archivo);
    setPerfilError("");

    if (archivo) {
      urlTemporalRef.current = URL.createObjectURL(archivo);
      setVistaPrevia(urlTemporalRef.current);
    } else {
      urlTemporalRef.current = "";
      setVistaPrevia(usuario.foto_perfil || "");
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setPerfilError("");
    setPerfilExito("");
    setGuardandoPerfil(true);

    const datos = new FormData();
    Object.entries(form).forEach(([key, value]) => datos.append(key, value));
    if (fotoSeleccionada) datos.append("foto_perfil", fotoSeleccionada);

    try {
      const resultado = await actualizarPerfil(datos);
      setForm({
        nombre: resultado.usuario.nombre || "",
        apellido: resultado.usuario.apellido || "",
        email: resultado.usuario.email || "",
        telefono: resultado.usuario.telefono || "",
      });
      if (urlTemporalRef.current) URL.revokeObjectURL(urlTemporalRef.current);
      urlTemporalRef.current = "";
      setFotoSeleccionada(null);
      setVistaPrevia(resultado.usuario.foto_perfil || "");
      onUpdated(resultado.usuario);
      setPerfilExito(resultado.message);
    } catch (actualizacionError) {
      setPerfilError(actualizacionError.message || "No se pudo actualizar el perfil.");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setExito("");

    if (passwordNueva !== confirmacion) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    if (passwordNueva.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      const resultado = await cambiarPassword(passwordActual, passwordNueva);
      setExito(resultado.message);
      setPasswordActual("");
      setPasswordNueva("");
      setConfirmacion("");
    } catch (cambioError) {
      setError(cambioError.message || "No se pudo cambiar la contraseña.");
    }
  };

  return (
    <div className="perfil-modal-backdrop">
      <button
        type="button"
        className="perfil-modal-dismiss"
        aria-label="Cerrar perfil"
        onClick={onClose}
      />
      <section
        className="perfil-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="perfil-modal-title"
      >
        <header className="perfil-modal-header">
          <div>
            <span className="perfil-eyebrow">CUENTA PERSONAL</span>
            <h2 id="perfil-modal-title">Mi perfil</h2>
          </div>
          <button type="button" className="perfil-close" aria-label="Cerrar" onClick={onClose}>
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </header>

        <div className="perfil-modal-content">
          <form className="perfil-edit-form" onSubmit={handleProfileSubmit}>
            <div className="perfil-identity">
              <div className="perfil-photo-control">
                <PerfilAvatar
                  key={vistaPrevia}
                  usuario={{ ...usuario, foto_perfil: vistaPrevia }}
                  nombre={`${form.nombre} ${form.apellido}`.trim()}
                />
                <label className="perfil-photo-button">
                  <i className="fas fa-camera" aria-hidden="true" />
                  Cambiar foto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
              <div className="perfil-role-copy">
                <h3>{[form.nombre, form.apellido].filter(Boolean).join(" ") || "Usuario InnHub"}</h3>
                <span className="perfil-role">{usuario.cargo || usuario.rol}</span>
              </div>
            </div>

            <div className="perfil-edit-grid">
              <label>
                Nombre
                <input name="nombre" value={form.nombre} onChange={handleProfileChange} maxLength={100} required />
              </label>
              <label>
                Apellido
                <input name="apellido" value={form.apellido} onChange={handleProfileChange} maxLength={100} required />
              </label>
              <label>
                Correo electrónico
                <input name="email" type="email" value={form.email} onChange={handleProfileChange} maxLength={45} required />
              </label>
              <label>
                Teléfono
                <input name="telefono" type="tel" value={form.telefono} onChange={handleProfileChange} maxLength={10} />
              </label>
            </div>

            <div className="perfil-detail perfil-document-detail">
              <i className="fas fa-id-card" aria-hidden="true" />
              <div><small>Documento de usuario</small><strong>{usuario.documento}</strong></div>
            </div>

            {perfilError && <div className="perfil-feedback perfil-feedback-error" role="alert">{perfilError}</div>}
            {perfilExito && <div className="perfil-feedback perfil-feedback-success" role="status">{perfilExito}</div>}

            <div className="perfil-modal-actions">
              <button type="submit" className="perfil-save" disabled={guardandoPerfil}>
                <i className="fas fa-user-check" aria-hidden="true" />
                {guardandoPerfil ? "Guardando..." : "Guardar perfil"}
              </button>
            </div>
          </form>

          <form className="perfil-password-form" onSubmit={handlePasswordSubmit}>
            <div className="perfil-section-heading">
              <span className="perfil-section-icon"><i className="fas fa-shield-alt" /></span>
              <div>
                <h3>Cambiar contraseña</h3>
                <p>Usa una contraseña segura de al menos 8 caracteres.</p>
              </div>
            </div>

            {error && <div className="perfil-feedback perfil-feedback-error" role="alert">{error}</div>}
            {exito && <div className="perfil-feedback perfil-feedback-success" role="status">{exito}</div>}

            <label>
              Contraseña actual
              <input
                type="password"
                autoComplete="current-password"
                value={passwordActual}
                onChange={(event) => setPasswordActual(event.target.value)}
                required
              />
            </label>
            <div className="perfil-password-grid">
              <label>
                Nueva contraseña
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={passwordNueva}
                  onChange={(event) => setPasswordNueva(event.target.value)}
                  required
                />
              </label>
              <label>
                Confirmar contraseña
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmacion}
                  onChange={(event) => setConfirmacion(event.target.value)}
                  required
                />
              </label>
            </div>
            <div className="perfil-modal-actions">
              <button type="button" className="perfil-cancel" onClick={onClose}>Cerrar</button>
              <button type="submit" className="perfil-save">
                <i className="fas fa-lock" aria-hidden="true" />
                Actualizar contraseña
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default PerfilModal;
