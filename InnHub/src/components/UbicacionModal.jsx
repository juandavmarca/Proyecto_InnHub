function UbicacionModal({ onCerrar }) {
  return (
    <div className="ubicacion-modal-backdrop" onClick={onCerrar}>

      <div className="modal-ubicacion" onClick={(event) => event.stopPropagation()}>

        <div className="modal-header">
          <h2>Nuestra ubicación</h2>

          <button onClick={onCerrar}>
            ✕
          </button>
        </div>

        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248.1259191073526!2d-75.31065244142738!3d5.711012404888716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e46c3699d51d255%3A0x4a6f07800f693c20!2sHotel%20El%20Valencia!5e0!3m2!1ses-419!2sco!4v1788935418172!5m2!1ses-419!2sco"
          title="Ubicación de Hotel Valencia"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />

        <div className="modal-footer">
          <button onClick={onCerrar}>
            Cerrar
          </button>
        </div>

      </div>

    </div>
  );
}

export default UbicacionModal;