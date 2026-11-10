const BASE_URL = "https://innhub.site/backend";

async function solicitarAuth(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}/Auth/${endpoint}.php`, {
    credentials: "include",
    ...options,
  });
  const resultado = await response.json();

  if (response.status === 401 && endpoint === "sesion") {
    return null;
  }

  if (!response.ok || !resultado.success) {
    throw new Error(resultado.message || "No se pudo completar la autenticación.");
  }

  return resultado;
}

export async function iniciarSesion(usuario, password) {
  const resultado = await solicitarAuth("login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password }),
  });
  return resultado.usuario;
}

export function solicitarRecuperacionPassword(email) {
  return solicitarAuth("solicitar_recuperacion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function confirmarRecuperacionPassword(email, codigo, passwordNueva) {
  return solicitarAuth("confirmar_recuperacion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, codigo, password_nueva: passwordNueva }),
  });
}

export async function obtenerSesion() {
  const resultado = await solicitarAuth("sesion");
  return resultado?.usuario ?? null;
}

export function cerrarSesion() {
  return solicitarAuth("logout", { method: "POST" });
}

export function cambiarPassword(passwordActual, passwordNueva) {
  return solicitarAuth("cambiar_password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      password_actual: passwordActual,
      password_nueva: passwordNueva,
    }),
  });
}

export function actualizarPerfil(perfil) {
  return solicitarAuth("actualizar_perfil", {
    method: "POST",
    body: perfil,
  });
}

async function solicitarVerificacion(endpoint, datos) {
  const response = await fetch(`${BASE_URL}/Verificacion/${endpoint}.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(datos),
  });
  let resultado;
  try {
    resultado = await response.json();
  } catch {
    throw new Error(
      `El servidor no pudo completar la verificación (HTTP ${response.status}). Inténtalo de nuevo.`
    );
  }

  if (!response.ok || !resultado.exito) {
    throw new Error(resultado.mensaje || "No se pudo completar la verificación.");
  }

  return resultado;
}

export function solicitarCodigoWhatsapp(telefono, cliente, termsAccepted, privacyAccepted) {
  return solicitarVerificacion("solicitar", { telefono, cliente, termsAccepted, privacyAccepted });
}

export function verificarCodigoWhatsapp(telefono, codigo) {
  return solicitarVerificacion("verificar", { telefono, codigo });
}

export function solicitarCodigoConsultaReserva(telefono) {
  return solicitarVerificacion("solicitar_codigo_reserva", { telefono });
}

export function verificarCodigoConsultaReserva(telefono, codigo) {
  return solicitarVerificacion("verificar_reserva", { telefono, codigo });
}

async function solicitarPago(endpoint, datos) {
  const response = await fetch(`${BASE_URL}/Pagos/${endpoint}.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(datos),
  });
  const resultado = await response.json();

  if (!response.ok || !resultado.exito) {
    throw new Error(resultado.mensaje || "No se pudo completar la operación de pago.");
  }

  return resultado;
}

export function iniciarPagoWompi(datos) {
  return solicitarPago("iniciar", datos);
}

export function consultarEstadoPago(referencia) {
  return solicitarPago("estado", { referencia });
}

export async function enviarSugerenciaAtencion(email, descripcion) {
  const response = await fetch(`${BASE_URL}/Contacto/sugerencia.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, descripcion }),
  });
  let resultado;
  try {
    resultado = await response.json();
  } catch {
    throw new Error(
      `El servidor no pudo completar el envío (HTTP ${response.status}). Inténtalo de nuevo.`
    );
  }

  if (!response.ok || !resultado.exito) {
    throw new Error(resultado.mensaje || "No se pudo enviar la sugerencia.");
  }

  return resultado;
}

export function reenviarCorreoAceptacion() {
  return solicitarVerificacion("reenviar_correo", {});
}

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
  const resultado = await response.json();
  if (!response.ok || !resultado.success) {
    throw new Error(resultado.message || "No se pudo guardar el cliente.");
  }
  return resultado;
}

export async function editarCliente(cliente) {
  const response = await fetch(`${BASE_URL}/Clientes/editar.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cliente),
  });
  const resultado = await response.json();
  if (!response.ok || !resultado.success) {
    throw new Error(resultado.message || "No se pudo actualizar el cliente.");
  }
  return resultado;
}

export async function actualizarEstadoCliente(idCliente, estado) {
  const response = await fetch(`${BASE_URL}/Clientes/estado.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id_cliente: idCliente, estado }),
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
