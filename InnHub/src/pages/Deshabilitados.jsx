import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  obtenerClientes,
  obtenerEmpleados,
  obtenerHabitaciones,
  actualizarEstadoCliente,
  actualizarEstadoEmpleado,
  actualizarEstadoHabitacion,
} from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import CenteredToast from "../components/CenteredToast";

const obtenerEstadoDeshabilitado = (item) =>
  item?.deshabilitado ?? Boolean(item?.estado && String(item.estado).toLowerCase().includes("deshabil"));

const getHabitacionStatus = (habitacion) => {
  const estado = String(habitacion?.estado || "").toLowerCase();
  if (estado.includes("no disponible")) return "no-disponible";
  if (estado.includes("ocupada")) return "ocupada";
  if (estado.includes("mantenimiento")) return "mantenimiento";
  if (estado.includes("disponible")) return "disponible";
  return "sin-estado";
};

function Deshabilitados() {
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const cargarDatos = async () => {
    try {
      const [clientesData, empleadosData, habitacionesData] = await Promise.all([
        obtenerClientes(),
        obtenerEmpleados(),
        obtenerHabitaciones(),
      ]);

      const clientesEnriquecidos = clientesData
        .map((cliente) => ({
          ...cliente,
          deshabilitado: obtenerEstadoDeshabilitado(cliente),
        }))
        .filter((cliente) => cliente.deshabilitado);

      const empleadosEnriquecidos = empleadosData
        .map((empleado) => ({
          ...empleado,
          deshabilitado: obtenerEstadoDeshabilitado(empleado),
        }))
        .filter((empleado) => empleado.deshabilitado);

      const habitacionesEnriquecidas = habitacionesData
        .map((habitacion) => ({
          ...habitacion,
          statusCategory: getHabitacionStatus(habitacion),
        }))
        .filter((habitacion) => habitacion.statusCategory === "no-disponible");

      setClientes(clientesEnriquecidos);
      setEmpleados(empleadosEnriquecidos);
      setHabitaciones(habitacionesEnriquecidas);
    } catch (error) {
      console.error(error);
      setToast({ show: true, message: "Error al cargar los elementos deshabilitados", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const confirmHabilitarCliente = (cliente) => {
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
          setClientes((prev) => prev.filter((item) => item.documento !== cliente.documento));
          setToast({ show: true, message: `Cliente ${cliente.nombre} ${cliente.apellido} habilitado correctamente`, type: "success" });
        } catch (error) {
          console.error(error);
          setToast({ show: true, message: "Error al habilitar el cliente", type: "error" });
        }
      },
    });
  };

  const confirmHabilitarEmpleado = (empleado) => {
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
          setEmpleados((prev) => prev.filter((item) => item.documento !== empleado.documento));
          setToast({ show: true, message: `Empleado ${empleado.nombre} ${empleado.apellido} habilitado correctamente`, type: "success" });
        } catch (error) {
          console.error(error);
          setToast({ show: true, message: "Error al habilitar el empleado", type: "error" });
        }
      },
    });
  };

  const confirmHabilitarHabitacion = (habitacion) => {
    setConfirm({
      show: true,
      title: "Habilitar habitación",
      message: `¿Está seguro que desea habilitar la habitación ${habitacion.numero}?`,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, show: false }));
        try {
          const res = await actualizarEstadoHabitacion(habitacion.id_habitacion, "Disponible");
          if (!res.success) {
            setToast({ show: true, message: res.message || "No se pudo habilitar la habitación", type: "error" });
            return;
          }
          setHabitaciones((prev) => prev.filter((item) => item.id_habitacion !== habitacion.id_habitacion));
          setToast({ show: true, message: `Habitación ${habitacion.numero} habilitada correctamente`, type: "success" });
        } catch (error) {
          console.error(error);
          setToast({ show: true, message: "Error al habilitar la habitación", type: "error" });
        }
      },
    });
  };

  const mostrarSeccion = (items, type) => {
    if (!items.length) {
      return (
        <div className="disabled-empty-state">
          No hay {type} deshabilitados en este momento.
        </div>
      );
    }

    if (type === "clientes") {
      return (
        <div className="disabled-list">
          {items.map((item) => (
            <div key={item.documento} className="disabled-row">
              <div>
                <strong>{item.nombre} {item.apellido}</strong>
                <span>{item.documento}</span>
              </div>
              <button className="btn btn-warning btn-sm disabled-action-btn" onClick={() => confirmHabilitarCliente(item)}>
                Habilitar
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (type === "empleados") {
      return (
        <div className="disabled-list">
          {items.map((item) => (
            <div key={item.documento} className="disabled-row">
              <div>
                <strong>{item.nombre} {item.apellido}</strong>
                <span>{item.cargo}</span>
              </div>
              <button className="btn btn-warning btn-sm disabled-action-btn" onClick={() => confirmHabilitarEmpleado(item)}>
                Habilitar
              </button>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="disabled-list">
        {items.map((item) => (
          <div key={item.id_habitacion} className="disabled-row">
            <div>
              <strong>Habitación {item.numero}</strong>
              <span>{item.tipo}</span>
            </div>
            <button className="btn btn-warning btn-sm disabled-action-btn" onClick={() => confirmHabilitarHabitacion(item)}>
              Habilitar
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="alert alert-info">Cargando elementos deshabilitados...</div>;
  }

  return (
    <div className="dashboard-page settings-page">
      <div className="dashboard-page-header settings-page-header">
        <div>
          <h1>Deshabilitados</h1>
          <p className="settings-subtitle">Elementos deshabilitados por módulo</p>
        </div>
        <NavLink to="/dashboard" className="btn btn-secondary">
          Regresar al panel administrativo
        </NavLink>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-header">
            <h2>Clientes deshabilitados</h2>
            <span className="settings-count">{clientes.length}</span>
          </div>
          {mostrarSeccion(clientes, "clientes")}
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <h2>Empleados deshabilitados</h2>
            <span className="settings-count">{empleados.length}</span>
          </div>
          {mostrarSeccion(empleados, "empleados")}
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <h2>Habitaciones deshabilitadas</h2>
            <span className="settings-count">{habitaciones.length}</span>
          </div>
          {mostrarSeccion(habitaciones, "habitaciones")}
        </div>
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

export default Deshabilitados;
