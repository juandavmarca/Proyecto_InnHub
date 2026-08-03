const BASE_URL = "http://localhost/ERPInnHub/backend";

export async function obtenerClientes() {
  try {
    const response = await fetch(`${BASE_URL}/Clientes/listar.php`);
    if (!response.ok) {
      throw new Error("Error al obtener clientes");
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function crearCliente(cliente) {
  const response = await fetch(`${BASE_URL}/Clientes/crear.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cliente),
  });
  return response.json();
}

export async function editarCliente(cliente) {
  const response = await fetch(`${BASE_URL}/Clientes/editar.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cliente),
  });
  return response.json();
}

export async function actualizarEstadoCliente(documento, estado) {
  const response = await fetch(`${BASE_URL}/Clientes/estado.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ documento, estado }),
  });
  return response.json();
}

export async function obtenerEmpleados() {
  try {
    const response = await fetch(`${BASE_URL}/Empleados/listar.php`);
    if (!response.ok) {
      throw new Error("Error al obtener empleados");
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function crearEmpleado(empleado) {
  const response = await fetch(`${BASE_URL}/Empleados/crear.php`, {
    method: "POST",
    body: empleado,
  });
  return response.json();
}

export async function editarEmpleado(empleado) {
  const response = await fetch(`${BASE_URL}/Empleados/editar.php`, {
    method: "POST",
    body: empleado,
  });
  return response.json();
}

export async function actualizarEstadoEmpleado(documento, estado) {
  const response = await fetch(`${BASE_URL}/Empleados/estado.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ documento, estado }),
  });
  return response.json();
}

export async function obtenerHabitaciones() {
  try {
    const response = await fetch(`${BASE_URL}/Habitaciones/listar.php`);
    if (!response.ok) {
      throw new Error("Error al obtener habitaciones");
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function crearHabitacion(habitacion) {
  const response = await fetch(`${BASE_URL}/Habitaciones/crear.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(habitacion),
  });
  return response.json();
}

export async function editarHabitacion(habitacion) {
  const response = await fetch(`${BASE_URL}/Habitaciones/editar.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(habitacion),
  });
  return response.json();
}

export async function actualizarEstadoHabitacion(id_habitacion, estado) {
  const response = await fetch(`${BASE_URL}/Habitaciones/estado.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id_habitacion, estado }),
  });
  return response.json();
}
