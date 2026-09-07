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

export async function obtenerCamas(id_habitacion) {
  try {
    const query = id_habitacion ? `?id_habitacion=${encodeURIComponent(id_habitacion)}` : "";
    const response = await fetch(`${BASE_URL}/Camas/listar.php${query}`);
    if (!response.ok) {
      throw new Error("Error al obtener camas");
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function obtenerHabitacionPorId(id_habitacion) {
  try {
    const habitaciones = await obtenerHabitaciones();
    return habitaciones.find((habitacion) => String(habitacion.id_habitacion) === String(id_habitacion)) || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function crearCama(cama) {
  const response = await fetch(`${BASE_URL}/Camas/crear.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cama),
  });
  return response.json();
}

export async function editarCama(cama) {
  const response = await fetch(`${BASE_URL}/Camas/editar.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cama),
  });
  return response.json();
}

export async function eliminarCama(idCamas) {
  const response = await fetch(`${BASE_URL}/Camas/eliminar.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idCamas }),
  });
  return response.json();
}

export async function obtenerCaracteristicas(id_habitacion) {
  try {
    const query = id_habitacion ? `?id_habitacion=${encodeURIComponent(id_habitacion)}` : "";
    const response = await fetch(`${BASE_URL}/Caracteristicas/listar.php${query}`);
    if (!response.ok) {
      throw new Error("Error al obtener características");
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function crearCaracteristica(caracteristica) {
  const response = await fetch(`${BASE_URL}/Caracteristicas/crear.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(caracteristica),
  });
  return response.json();
}

export async function eliminarCaracteristica(idcarac) {
  const response = await fetch(`${BASE_URL}/Caracteristicas/eliminar.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idcarac }),
  });
  return response.json();
}

export async function obtenerImagenes(id_habitacion) {
  try {
    const query = id_habitacion ? `?id_habitacion=${encodeURIComponent(id_habitacion)}` : "";
    const response = await fetch(`${BASE_URL}/Imagenes/listar.php${query}`);
    if (!response.ok) {
      throw new Error("Error al obtener imágenes");
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function crearImagen(imagen) {
  const isFormData = imagen instanceof FormData;

  const response = await fetch(`${BASE_URL}/Imagenes/crear.php`, {
    method: "POST",
    headers: isFormData ? undefined : {
      "Content-Type": "application/json",
    },
    body: isFormData ? imagen : JSON.stringify(imagen),
  });
  return response.json();
}

export async function eliminarImagen(id) {
  const response = await fetch(`${BASE_URL}/Imagenes/eliminar.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });
  return response.json();
}
