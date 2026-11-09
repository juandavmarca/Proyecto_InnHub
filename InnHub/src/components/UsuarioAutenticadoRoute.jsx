import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { obtenerSesion } from "../services/api";

function UsuarioAutenticadoRoute({ children }) {
  const [estado, setEstado] = useState({ cargando: true, autorizado: false, error: "" });

  useEffect(() => {
    let activo = true;

    obtenerSesion()
      .then((usuario) => {
        if (activo) {
          setEstado({ cargando: false, autorizado: Boolean(usuario), error: "" });
        }
      })
      .catch((error) => {
        if (activo) {
          setEstado({
            cargando: false,
            autorizado: false,
            error: error.message || "No se pudo verificar la sesión."
          });
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  if (estado.cargando) {
    return <div className="auth-status" role="status">Verificando acceso...</div>;
  }

  if (estado.error) {
    return (
      <div className="auth-status auth-status-error" role="alert">
        {estado.error}
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  return estado.autorizado ? children : <Navigate replace to="/login" />;
}

export default UsuarioAutenticadoRoute;
