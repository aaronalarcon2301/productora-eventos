import { API_URL } from './config';

// Wrapper de fetch para JSON. Lanza Error con el mensaje que devuelve el backend
// (incluye el detalle de las validaciones de Zod) para mostrarlo tal cual en pantalla.
export async function apiFetch(ruta, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detalles = Array.isArray(data?.detalles) ? data.detalles.map((d) => d.mensaje).join(' · ') : '';
    throw new Error(detalles || data?.error || `Error ${res.status}`);
  }
  return data;
}
