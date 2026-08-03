import EmpleadoModal from "../components/EmpleadoModal";
import { obtenerEmpleados, actualizarEstadoEmpleado } from "../services/api";
import { useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import CenteredToast from "../components/CenteredToast";
function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empleadoEditar, setEmpleadoEditar] = useState(null);
  const [mostrarDeshabilitados, setMostrarDeshabilitados] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  useEffect(() => {
    obtenerEmpleados().then((data) => {
      const enriched = data.map((empleado) => ({
        ...empleado,
        deshabilitado:
          empleado.deshabilitado ??
          Boolean(empleado.estado && String(empleado.estado).toLowerCase().includes("deshabil")),
      }));
      setEmpleados(enriched);
      setLoading(false);
    });
  }, []);

  const handleEditarEmpleado = (empleado) => {
    setEmpleadoEditar(empleado);
  };

  const handleNuevoEmpleado = () => {
    setEmpleadoEditar(null);
    setMostrarDeshabilitados(false);
  };

  const handleVerDeshabilitados = () => {
    setMostrarDeshabilitados(true);
  };

  const handleDeshabilitarEmpleado = async (empleado) => {
    setConfirm({
      show: true,
      title: "Deshabilitar empleado",
      message: `¿Está seguro que desea deshabilitar a ${empleado.nombre} ${empleado.apellido}?`,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, show: false }));
        try {
          const res = await actualizarEstadoEmpleado(empleado.documento, "Deshabilitado");
          if (!res.success) {
            setToast({ show: true, message: res.message || "No se pudo deshabilitar el empleado", type: "error" });
            return;
          }
          setEmpleados((prev) =>
            prev.map((item) =>
              item.documento === empleado.documento
                ? { ...item, estado: "Deshabilitado", deshabilitado: true }
                : item
            )
          );
          setToast({ show: true, message: `Empleado ${empleado.nombre} ${empleado.apellido} deshabilitado correctamente`, type: "success" });
        } catch (error) {
          console.error(error);
          setToast({ show: true, message: "Error al actualizar el estado del empleado", type: "error" });
        }
      },
    });
  };

  const handleHabilitarEmpleado = async (empleado) => {
    setConfirm({
      show: true,
      title: "Habilitar empleado",
      message: `¿Está seguro que desea habilitar a ${empleado.nombre} ${empleado.apellido}?`,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, show: false }));
        try {
          const res = await actualizarEstadoEmpleado(empleado.documento, "Activo");
          if (!res.success) {
            setToast({ show: true, message: res.message || "No se pudo habilitar el empleado", type: "error" });
            return;
          }
          setEmpleados((prev) =>
            prev.map((item) =>
              item.documento === empleado.documento
                ? { ...item, estado: "Activo", deshabilitado: false }
                : item
            )
          );
          setToast({ show: true, message: `Empleado ${empleado.nombre} ${empleado.apellido} habilitado correctamente`, type: "success" });
        } catch (error) {
          console.error(error);
          setToast({ show: true, message: "Error al actualizar el estado del empleado", type: "error" });
        }
      },
    });
  };

  const empleadosFiltrados = empleados.filter((empleado) =>
    mostrarDeshabilitados ? empleado.deshabilitado : !empleado.deshabilitado
  );

  if (loading) {
    return <div className="alert alert-info">Cargando empleados...</div>;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Empleados</h2>
        <div>
          <button className="btn btn-success" data-bs-toggle="modal" data-bs-target="#empleadoModal" onClick={handleNuevoEmpleado}>
            + Nuevo Empleado
          </button>
          <button type="button" className="btn btn-secondary ms-2" onClick={handleVerDeshabilitados}>
            Deshabilitados
          </button>
        </div>
      </div>

      <EmpleadoModal
        empleadoEditar={empleadoEditar}
        onEmpleadoCreado={() => {
          setLoading(true);
          obtenerEmpleados().then((data) => {
            const enriched = data.map((empleado) => ({
              ...empleado,
              deshabilitado:
                empleado.deshabilitado ??
                Boolean(empleado.estado && String(empleado.estado).toLowerCase().includes("deshabil")),
            }));
            setEmpleados(enriched);
            setLoading(false);
            setEmpleadoEditar(null);
          });
        }}
      />
      {/* tabla de empleados*/}
      <table className="table table-striped mt-3 table-innhub">
        <thead>
          <tr>
            <th>Documento</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Cargo</th>
            <th>Telefono</th>
            <th>Email</th>
            <th>Foto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empleadosFiltrados.map((empleado) => (
            <tr key={empleado.documento}>
              <td>{empleado.documento}</td>
              <td>{empleado.nombre}</td>
              <td>{empleado.apellido}</td>
              <td>{empleado.cargo}</td>
              <td>{empleado.telefono}</td>
              <td>{empleado.email}</td>
              <td>
                <img
                  className="avatar-img"
                  src={empleado.foto_perifl || ""}
                  alt={empleado.nombre || "foto"}
                />
              </td>
              <td>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm" style={{backgroundColor: '#1b6b4f', color: 'white', border: 'none'}} data-bs-toggle="modal" data-bs-target="#empleadoModal" onClick={() => handleEditarEmpleado(empleado)} title="Editar">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  {mostrarDeshabilitados ? (
                    <button className="btn btn-sm" style={{backgroundColor: '#198754', color: 'white', border: 'none'}} onClick={() => handleHabilitarEmpleado(empleado)} title="Habilitar">
                      <i className="fa-solid fa-check"></i>
                    </button>
                  ) : (
                    <button className="btn btn-sm" style={{backgroundColor: '#c82333', color: 'white', border: 'none'}} onClick={() => handleDeshabilitarEmpleado(empleado)} title="Deshabilitar">
                      <i className="fa-solid fa-ban"></i>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {mostrarDeshabilitados && (
        <div className="mt-3">
          <button className="btn btn-secondary" onClick={() => setMostrarDeshabilitados(false)}>
            Regresar a tabla empleados
          </button>
        </div>
      )}
      <ConfirmDialog
        show={confirm.show}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => confirm.onConfirm && confirm.onConfirm()}
        onCancel={() => setConfirm((c) => ({ ...c, show: false }))}
      />
      <CenteredToast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}

export default Empleados;