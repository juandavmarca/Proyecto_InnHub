import { useEffect } from "react";

function CenteredToast({ show, message, type = "info", duration = 2000, onClose, className = "" }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className={`toast-backdrop toast-${type} ${className}`.trim()}>
      <div className="toast-message">
        {message}
      </div>
    </div>
  );
}

export default CenteredToast;
