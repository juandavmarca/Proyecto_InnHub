function ConfirmDialog({ show, title, message, confirmText = "Sí", cancelText = "Cancelar", onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div className="confirm-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-dialog">
        <div className="confirm-header">
          <h5>{title || "Confirmar"}</h5>
        </div>
        <div className="confirm-body">{message}</div>
        <div className="confirm-footer">
          <button className="btn btn-outline" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-primary ms-2" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
