import { API_URL } from './config';
import { clearSession, getSession } from './session';

export async function apiFetch(
  ruta,
  { method = 'GET', body } = {}
) {
  let res;

  try {
    const token = getSession()?.token;

    res = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: {
        ...(body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {})
      },
      body: body !== undefined
        ? JSON.stringify(body)
        : undefined
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (
      res.status === 401 &&
      ruta !== '/auth/login' &&
      getSession()
    ) {
      clearSession();
      window.dispatchEvent(new Event('nes:sesion-expirada'));
    }

    const detalles = Array.isArray(data?.detalles)
      ? data.detalles.map(d => d.mensaje).join(' · ')
      : '';

    throw new Error(
      detalles || data?.error || `Error ${res.status}`
    );
  }

  return data;
}