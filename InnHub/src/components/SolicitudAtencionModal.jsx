import { useEffect, useState } from "react";
import { enviarSugerenciaAtencion } from "../services/api";

const correoDestino = "juandavmarca345@gmail.com";

export default function SolicitudAtencionModal({ onCerrar }) {
  const [correo, setCorreo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    const cerrarConEscape = (event) => {
      if (event.key === "Escape" && !enviando) onCerrar();
    };
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [enviando, onCerrar]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setEnviando(true);
    setError("");

    try {
      await enviarSugerenciaAtencion(correo, descripcion);
      setEnviado(true);
    } catch (submitError) {
      setError(submitError.message || "No se pudo enviar tu sugerencia. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="support-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !enviando) onCerrar();
      }}
    >
      <section
        className="support-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
      >
        <button
          className="support-modal-close"
          type="button"
          onClick={onCerrar}
          disabled={enviando}
          aria-label="Cerrar formulario"
        >
          ×
        </button>
        {enviado ? (
          <div className="support-modal-success" role="status">
            <h2 id="support-modal-title">¡Gracias por escribirnos!</h2>
            <p>Tu sugerencia fue enviada correctamente. Nuestro equipo la revisará.</p>
            <button className="support-modal-submit" type="button" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <span className="support-modal-eyebrow">Atención 24/7</span>
            <h2 id="support-modal-title">Cuéntanos cómo podemos ayudarte</h2>
            <p className="support-modal-intro">
              Déjanos tu correo y tu sugerencia. La recibiremos directamente para darle seguimiento.
            </p>
            <form className="support-modal-form" onSubmit={handleSubmit}>
              <label htmlFor="support-sender-email">Tu correo electrónico</label>
              <input
                id="support-sender-email"
                type="email"
                autoComplete="email"
                maxLength={254}
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                required
                disabled={enviando}
              />

              <label htmlFor="support-recipient-email">Para</label>
              <input
                id="support-recipient-email"
                type="email"
                value={correoDestino}
                readOnly
                aria-readonly="true"
              />

              <label htmlFor="support-description">Descripción</label>
              <textarea
                id="support-description"
                rows={5}
                maxLength={2000}
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                required
                disabled={enviando}
              />

              {error && <p className="support-modal-error" role="alert">{error}</p>}

              <button className="support-modal-submit" type="submit" disabled={enviando}>
                {enviando ? "Enviando…" : "Enviar sugerencia"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
