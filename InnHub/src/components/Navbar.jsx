import { useEffect, useState } from "react";
import { obtenerSesion } from "../services/api";
import PerfilModal from "./PerfilModal";

function Avatar({ usuario, iniciales, className = "" }) {
  const [imagenFallida, setImagenFallida] = useState(false);

  return (
    <span className={className}>
      {usuario.foto_perfil && !imagenFallida ? (
        <img src={usuario.foto_perfil} alt="" onError={() => setImagenFallida(true)} />
      ) : (
        iniciales
      )}
    </span>
  );
}

function Navbar() {
  const [usuario, setUsuario] = useState(null);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [error, setError] = useState("");
  const nombre = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ");
  const iniciales = nombre
    ? nombre.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase()
    : "U";

  useEffect(() => {
    let activo = true;

    obtenerSesion()
      .then((sesion) => {
        if (activo) setUsuario(sesion);
      })
      .catch((sesionError) => {
        if (activo) setError(sesionError.message || "No se pudo cargar el perfil.");
      });

    return () => {
      activo = false;
    };
  }, []);

  const abrirPerfil = () => {
    setMostrarPerfil(true);
    setError("");
  };

  return (
    <>
      <nav className="navbar navbar-custom">
      <div className="navbar-brand">
        <h1 className="navbar-brand-title">Panel administrativo</h1>
      </div>
        {usuario && (
          <div className="navbar-profile">
            <button
              type="button"
              className="navbar-profile-trigger"
              aria-haspopup="true"
              aria-label={`Perfil de ${nombre || usuario.email}`}
            >
              <span className="navbar-profile-copy">
                <strong>{nombre || usuario.email}</strong>
                <small>{usuario.cargo || usuario.rol}</small>
              </span>
              <Avatar
                key={usuario.foto_perfil}
                usuario={usuario}
                iniciales={iniciales}
                className="navbar-profile-avatar"
              />
              <i className="fas fa-chevron-down navbar-profile-chevron" aria-hidden="true" />
            </button>
            <div className="navbar-profile-menu">
              <div className="navbar-profile-menu-heading">
                <Avatar
                  key={usuario.foto_perfil}
                  usuario={usuario}
                  iniciales={iniciales}
                  className="navbar-profile-avatar navbar-profile-avatar-small"
                />
                <span><strong>{nombre || "Mi cuenta"}</strong><small>{usuario.email}</small></span>
              </div>
              <button type="button" className="navbar-profile-menu-item" onClick={abrirPerfil}>
                <i className="fas fa-user-circle" aria-hidden="true" />
                Ver perfil
                <i className="fas fa-arrow-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </nav>
      {error && <div className="navbar-profile-error" role="alert">{error}</div>}
      {mostrarPerfil && usuario && (
        <PerfilModal
          usuario={usuario}
          onClose={() => setMostrarPerfil(false)}
          onUpdated={setUsuario}
        />
      )}
    </>
  );
}

export default Navbar;
