// Utilidades HTTP compartidas por los servicios y controladores nuevos.

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Convierte un parámetro de ruta en un entero positivo o lanza un 400.
export function parseId(valor, nombre = "id") {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, `El ${nombre} indicado no es válido.`);
  }
  return id;
}
