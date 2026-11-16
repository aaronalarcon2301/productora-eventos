const CLAVE = 'nes-producciones-sesion';

export function getSession() {
  try {
    const data = JSON.parse(
      sessionStorage.getItem(CLAVE) || 'null'
    );

    return data?.token && data?.usuario ? data : null;
  } catch {
    return null;
  }
}

export function saveSession(data) {
  sessionStorage.setItem(CLAVE, JSON.stringify(data));
}

export function clearSession() {
  sessionStorage.removeItem(CLAVE);
}