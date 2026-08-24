import ClienteModal from "../components/ClienteModal";
import { obtenerClientes, actualizarEstadoCliente } from "../services/api";
import { useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import CenteredToast from "../components/CenteredToast";
function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [mostrarDeshabilitados, setMostrarDeshabilitados] = useState(false);
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  useEffect(() => {
    obtenerClientes().then((data) => {
      const enriched = data.map((cliente) => ({
        ...cliente,
        deshabilitado:
          cliente.deshabilitado ??
          Boolean(cliente.estado && String(cliente.estado).toLowerCase().includes("deshabil")),
      }));
      setClientes(enriched);
      setLoading(false);
    });
  }, []);

  const handleEditarCliente = (cliente) => {
    setClienteEditar(cliente);
  };

  const handleNuevoCliente = () => {
    setClienteEditar(null);
    setMostrarDeshabilitados(false);
  };

  const handleVerDeshabilitados = () => {
    setMostrarDeshabilitados(true);
  };

  const handleDeshabilitarCliente = async (cliente) => {
    setConfirm({
      show: true,
      title: "Deshabilitar cliente",
      message: `¿Está seguro que desea deshabilitar a ${cliente.nombre} ${cliente.apellido}?`,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, show: false }));
        try {
          const res = await actualizarEstadoCliente(cliente.documento, "Deshabilitado");
          if (!res.success) {
            setToast({ show: true, message: res.message || "No se pudo deshabilitar el cliente", type: "error" });
            return;
          }
          setClientes((prev) =>
            prev.map((item) =>
              item.documento === cliente.documento
                ? { ...item, estado: "Deshabilitado", deshabilitado: true }
                : item
            )
          );
          setToast({ show: true, message: `Cliente ${cliente.nombre} ${cliente.apellido} deshabilitado correctamente`, type: "success" });
        } catch (error) {
          console.error(error);
          setToast({ show: true, message: "Error al actualizar el estado del cliente", type: "error" });
        }
      },
    });
  };

  const handleHabilitarCliente = async (cliente) => {
    setConfirm({
      show: true,
      title: "Habilitar cliente",
      message: `¿Está seguro que desea habilitar a ${cliente.nombre} ${cliente.apellido}?`,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, show: false }));
        try {
          const res = await actualizarEstadoCliente(cliente.documento, "Activo");
          if (!res.success) {
            setToast({ show: true, message: res.message || "No se pudo habilitar el cliente", type: "error" });
            return;
          }
          setClientes((prev) =>
            prev.map((item) =>
              item.documento === cliente.documento
                ? { ...item, estado: "Activo", deshabilitado: false }
                : item
            )
          );
          setToast({ show: true, message: `Cliente ${cliente.nombre} ${cliente.apellido} habilitado correctamente`, type: "success" });
        } catch (error) {
          console.error(error);
          setToast({ show: true, message: "Error al actualizar el estado del cliente", type: "error" });
        }
      },
    });
  };

  const clientesFiltrados = clientes.filter((cliente) =>
    mostrarDeshabilitados ? cliente.deshabilitado : !cliente.deshabilitado
  );

  if (loading) {
    return <div className="alert alert-info">Cargando clientes...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1>Clientes</h1>
        <div className="dashboard-actions">
          <button className="btn btn-success" data-bs-toggle="modal" data-bs-target="#clienteModal" onClick={handleNuevoCliente}>
            + Nuevo Cliente
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleVerDeshabilitados}>
            Deshabilitados
          </button>
        </div>
      </div>

      <ClienteModal
        clienteEditar={clienteEditar}
        onSuccess={(message) => setToast({ show: true, message, type: "success" })}
        onClienteCreado={() => {
          setLoading(true);
          obtenerClientes().then((data) => {
            const enriched = data.map((cliente) => ({
              ...cliente,
              deshabilitado:
                cliente.deshabilitado ??
                Boolean(cliente.estado && String(cliente.estado).toLowerCase().includes("deshabil")),
            }));
            setClientes(enriched);
            setLoading(false);
            setClienteEditar(null);
          });
        }}
      />
      {/* tabla de clientes */}
      <div className="dashboard-table-card mt-3">
        <table className="table table-striped table-innhub">
        <thead>
          <tr>
            <th>Documento</th>
            <th>Tipo Documento</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Telefono</th>
            <th>Email</th>
            <th>Ciudad Residencia</th>
            <th>Acciones</th>
          
          </tr>
        </thead>
        <tbody>
          {clientesFiltrados.map((cliente) => (
            <tr key={cliente.documento}>
              <td>{cliente.documento}</td>
              <td>{cliente.tipo_documento}</td>
              <td>{cliente.nombre}</td>
              <td>{cliente.apellido}</td>
              <td>{cliente.telefono}</td>
              <td>{cliente.email}</td>
              <td>{cliente.ciudad_re}</td>
              <td>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm" style={{backgroundColor: '#c89629', color: '#090808', border: 'none'}} data-bs-toggle="modal" data-bs-target="#clienteModal" onClick={() => handleEditarCliente(cliente)} title="Editar">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  {mostrarDeshabilitados ? (
                    <button className="btn btn-sm" style={{backgroundColor: '#1f1a17', color: '#c89629', border: '1px solid rgba(255,255,255,0.1)'}} onClick={() => handleHabilitarCliente(cliente)} title="Habilitar">
                      <i className="fa-solid fa-check"></i>
                    </button>
                  ) : (
                    <button className="btn btn-sm" style={{backgroundColor: '#8c1f1f', color: 'white', border: 'none'}} onClick={() => handleDeshabilitarCliente(cliente)} title="Deshabilitar">
                      <i className="fa-solid fa-ban"></i>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
        </div>
        {mostrarDeshabilitados && (
          <div className="mt-3">
            <button className="btn btn-secondary" onClick={() => setMostrarDeshabilitados(false)}>
              Regresar a tabla clientes
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
      </div>
  );
}

export default Clientes;