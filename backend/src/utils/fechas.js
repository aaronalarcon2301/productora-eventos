// El modelo Evento guarda una sola fecha (sin hora de término).
// Regla del sistema: un evento se considera FINALIZADO cuando
//   - se marcó como finalizado desde la app (campo `finalizadoAt`), o
//   - terminó el día del evento (medianoche UTC del día siguiente).
// Si más adelante se agregan fechaInicio / fechaFin al evento, basta con cambiar `eventoFinalizado` aquí.

const DIA_MS = 24 * 60 * 60 * 1000;

export function inicioDelDia(fecha) {
  const d = new Date(fecha);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function finDelDia(fecha) {
  return new Date(inicioDelDia(fecha).getTime() + DIA_MS);
}

export function eventoFinalizado(evento, ahora = new Date()) {
  if (evento.finalizadoAt) return true;
  return finDelDia(evento.fecha) <= ahora;
}
