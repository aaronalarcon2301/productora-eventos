import prisma from "../config/prisma.js";
import { httpError } from "../utils/http.js";
import { eventoFinalizado } from "../utils/fechas.js";

const INCLUIR = { cliente: true, lugar: true };

function conEstado(evento) {
  return { ...evento, finalizado: eventoFinalizado(evento) };
}

// Lo que queda por hacer después de finalizar: evaluar al personal y cerrar los equipos.
async function calcularPendientes(eventoId) {
  const [asignaciones, evaluaciones, reservas] = await Promise.all([
    prisma.asignacionTrabajador.findMany({ where: { eventoId } }),
    prisma.evaluacion.findMany({ where: { eventoId } }),
    prisma.reservaEquipo.findMany({ where: { eventoId } }),
  ]);
  const evaluados = new Set(evaluaciones.map((e) => e.trabajadorId));
  return {
    trabajadoresSinEvaluar: asignaciones.filter((a) => !evaluados.has(a.trabajadorId)).length,
    equiposPendientes: reservas.filter((r) => r.estado !== "DEVUELTO").length,
  };
}

// Marca el evento como finalizado, sin importar su fecha.
export async function finalizarEvento(id, ahora = new Date()) {
  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) throw httpError(404, "El evento no existe.");
  if (evento.cancelado) throw httpError(409, "Un evento cancelado no se puede finalizar.");
  if (eventoFinalizado(evento, ahora)) {
    throw httpError(409, evento.finalizadoAt ? "Este evento ya fue finalizado." : "Este evento ya finalizó: su fecha ya pasó.");
  }

  const actualizado = await prisma.evento.update({
    where: { id },
    data: { finalizadoAt: ahora },
    include: INCLUIR,
  });
  return { evento: conEstado(actualizado), pendientes: await calcularPendientes(id) };
}

// Deshace una finalización hecha a mano (por ejemplo, si se apretó por error).
// No se puede si el evento ya pasó de fecha o si ya tiene evaluaciones o incidentes registrados.
export async function reabrirEvento(id, ahora = new Date()) {
  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) throw httpError(404, "El evento no existe.");
  if (!evento.finalizadoAt) {
    throw httpError(409, eventoFinalizado(evento, ahora)
      ? "No se puede reabrir: este evento finalizó porque su fecha ya pasó."
      : "Este evento no está finalizado.");
  }
  if (eventoFinalizado({ ...evento, finalizadoAt: null }, ahora)) {
    throw httpError(409, "No se puede reabrir: la fecha del evento ya pasó.");
  }

  const [evaluaciones, incidentes] = await Promise.all([
    prisma.evaluacion.findMany({ where: { eventoId: id } }),
    prisma.incidente.findMany({ where: { eventoId: id } }),
  ]);
  if (evaluaciones.length > 0 || incidentes.length > 0) {
    throw httpError(409, "No se puede reabrir: el evento ya tiene evaluaciones o incidentes registrados.");
  }

  const actualizado = await prisma.evento.update({
    where: { id },
    data: { finalizadoAt: null },
    include: INCLUIR,
  });
  return { evento: conEstado(actualizado) };
}
