import ClienteModal from "../components/ClienteModal";
import { obtenerClientes, actualizarEstadoCliente } from "../services/api";
import { useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import CenteredToast from "../components/CenteredToast";

const normalizeSearchText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [clienteEditar, setClienteEditar] = useState(null);
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
  };

  const handleDeshabilitarCliente = async (cliente) => {
    setConfirm({
      show: true,
      title: "Deshabilitar cliente",
      message: `¿Está seguro que desea deshabilitar a ${cliente.nombre} ${cliente.apellido}?`,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, show: false }));
        try {
          const res = await actualizarEstadoCliente(cliente.id_cliente, "Deshabilitado");
          if (!res.success) {
            setToast({ show: true, message: res.message || "No se pudo deshabilitar el cliente", type: "error" });
            return;
          }
          setClientes((prev) =>
            prev.map((item) =>
              item.id_cliente === cliente.id_cliente
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
          const res = await actualizarEstadoCliente(cliente.id_cliente, "Activo");
          if (!res.success) {
            setToast({ show: true, message: res.message || "No se pudo habilitar el cliente", type: "error" });
            return;
          }
          setClientes((prev) =>
            prev.map((item) =>
              item.id_cliente === cliente.id_cliente
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

  const terminoBusqueda = normalizeSearchText(busquedaNombre);
  const clientesFiltrados = clientes.filter((cliente) => {
    if (cliente.deshabilitado) return false;
    const nombreCompleto = normalizeSearchText(`${cliente.nombre || ""} ${cliente.apellido || ""}`);
    return nombreCompleto.includes(terminoBusqueda);
  });

  if (loading) {
    return <div className="alert alert-info">Cargando clientes...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header dashboard-page-header-with-search">
        <h1>Clientes</h1>
        <div className="dashboard-actions">
          <div className="dashboard-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              className="dashboard-search-input"
              aria-label="Buscar clientes por nombre o apellido"
              placeholder="Buscar por nombre o apellido"
              value={busquedaNombre}
              onChange={(event) => setBusquedaNombre(event.target.value)}
            />
          </div>
          <button className="btn btn-success" data-bs-toggle="modal" data-bs-target="#clienteModal" onClick={handleNuevoCliente}>
            + Nuevo Cliente
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
        <table className="table table-striped table-innhub mobile-record-cards">
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
          {clientesFiltrados.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center">
                {terminoBusqueda ? "No se encontraron clientes con ese nombre." : "No hay clientes registrados."}
              </td>
            </tr>
          ) : clientesFiltrados.map((cliente) => (
            <tr key={cliente.id_cliente}>
              <td data-label="Documento">{cliente.documento || "Pendiente"}</td>
              <td data-label="Tipo de documento">{cliente.tipo_documento || "Pendiente"}</td>
              <td data-label="Nombre">{cliente.nombre}</td>
              <td data-label="Apellido">{cliente.apellido}</td>
              <td data-label="Teléfono">{cliente.telefono}</td>
              <td data-label="Email">{cliente.email}</td>
              <td data-label="Ciudad">{cliente.ciudad_re || "Pendiente"}</td>
              <td data-label="Acciones">
                <div className="d-flex gap-2">
                  <button className="btn btn-sm" style={{backgroundColor: '#c89629', color: '#090808', border: 'none'}} data-bs-toggle="modal" data-bs-target="#clienteModal" onClick={() => handleEditarCliente(cliente)} title="Editar">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button className="btn btn-sm" style={{backgroundColor: '#8c1f1f', color: 'white', border: 'none'}} onClick={() => handleDeshabilitarCliente(cliente)} title="Deshabilitar">
                    <i className="fa-solid fa-ban"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
        </div>
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