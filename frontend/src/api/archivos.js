import { API_URL } from './config';
import { clearSession, getSession } from './session';

export const MAX_BYTES = 5 * 1024 * 1024;
export const ACEPTAR = '.xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.docx';

// Igual que apiFetch, pero con cuerpo binario y respuestas que no son JSON.
async function llamar(ruta, { method = 'GET', cuerpo, tipo } = {}) {
  let res;
  try {
    const token = getSession()?.token;
    res = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: {
        ...(tipo ? { 'Content-Type': tipo } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: cuerpo
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }

  if (!res.ok) {
    if (res.status === 401 && getSession()) {
      clearSession();
      window.dispatchEvent(new Event('nes:sesion-expirada'));
    }
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return res;
}

function validarTamano(archivo) {
  if (archivo.size > MAX_BYTES) throw new Error('El archivo supera el máximo de 5 MB.');
  if (archivo.size === 0) throw new Error('El archivo está vacío.');
}

// Lee el Excel y devuelve { datos, avisos }. No guarda nada en el servidor.
export async function importarExcel(archivo) {
  validarTamano(archivo);
  const res = await llamar('/trabajadores/importar-excel', {
    method: 'POST',
    cuerpo: archivo,
    tipo: archivo.type || 'application/octet-stream'
  });
  return res.json();
}

export async function subirArchivo(trabajadorId, archivo) {
  validarTamano(archivo);
  const res = await llamar(
    `/trabajadores/${trabajadorId}/archivos?nombre=${encodeURIComponent(archivo.name)}`,
    { method: 'POST', cuerpo: archivo, tipo: archivo.type || 'application/octet-stream' }
  );
  return res.json();
}

export async function listarArchivos(trabajadorId) {
  return (await llamar(`/trabajadores/${trabajadorId}/archivos`)).json();
}

export async function eliminarArchivo(trabajadorId, archivoId) {
  return (await llamar(`/trabajadores/${trabajadorId}/archivos/${archivoId}`, { method: 'DELETE' })).json();
}

export async function descargar(ruta, nombre) {
  const blob = await (await llamar(ruta)).blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const descargarPlantilla = () => descargar('/trabajadores/plantilla', 'plantilla-trabajador.xlsx');

export const descargarArchivo = (trabajadorId, archivo) =>
  descargar(`/trabajadores/${trabajadorId}/archivos/${archivo.id}`, archivo.nombre);
