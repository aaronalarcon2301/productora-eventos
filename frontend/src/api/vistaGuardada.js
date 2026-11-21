import { useState } from 'react';

// La pestaña en la que estás se guarda en el navegador (igual que la sesión):
// al refrescar la página vuelves al mismo lugar y al cerrar sesión se borra.
const PREFIJO = 'nes-vista:';

export function leerVista(clave) {
  try {
    return sessionStorage.getItem(PREFIJO + clave);
  } catch {
    return null;
  }
}

export function guardarVista(clave, valor) {
  try {
    sessionStorage.setItem(PREFIJO + clave, valor);
  } catch {
    // Si el navegador no deja guardar, la app sigue funcionando sin recordar la pestaña.
  }
}

export function borrarVistas() {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIJO))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // Nada que borrar.
  }
}

// Igual que useState, pero recuerda el valor tras refrescar. Solo acepta valores de `validas`.
export function useVistaGuardada(clave, validas, inicial) {
  const [vista, setVistaEstado] = useState(() => {
    const guardada = leerVista(clave);
    return validas.includes(guardada) ? guardada : inicial;
  });

  const setVista = (nueva) => {
    setVistaEstado(nueva);
    guardarVista(clave, nueva);
  };

  return [vista, setVista];
}
