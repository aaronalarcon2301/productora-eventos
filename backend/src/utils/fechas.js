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
