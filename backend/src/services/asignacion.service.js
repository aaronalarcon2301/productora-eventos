import prisma from "../config/prisma.js";
import { httpError } from "../utils/http.js";
import { eventoFinalizado, inicioDelDia, finDelDia } from "../utils/fechas.js";

export async function asignarTrabajador({ trabajadorId, eventoId, rol }) {
  const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId } });
  if (!trabajador) throw httpError(404, "El trabajador no existe.");
  if (trabajador.bloqueado) {
    throw httpError(409, "Este trabajador está bloqueado por una falta grave y no puede ser asignado.");
  }
  if (!trabajador.activo) {
    throw httpError(409, "Este trabajador está inactivo y no puede ser asignado.");
  }

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) throw httpError(404, "El evento no existe.");
  if (evento.cancelado) throw httpError(409, "No se puede asignar personal a un evento cancelado.");

  const cruce = await prisma.asignacionTrabajador.findFirst({
    where: {
      trabajadorId,
      eventoId: { not: eventoId },
      evento: {
        cancelado: false,
        fecha: { gte: inicioDelDia(evento.fecha), lt: finDelDia(evento.fecha) },
      },
    },
    include: { evento: { select: { nombre: true } } },
  });
  if (cruce) {
    throw httpError(
      409,
      `${trabajador.nombre} ya está asignado a "${cruce.evento.nombre}" el mismo día.`
    );
  }

  try {
    return await prisma.asignacionTrabajador.create({
      data: { trabajadorId, eventoId, rol: rol ?? trabajador.rolPrincipal },
      include: { trabajador: { select: { id: true, nombre: true } } },
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw httpError(409, "Este trabajador ya está asignado a este evento.");
    }
    throw err;
  }
}

export async function listarAsignacionesPorEvento(eventoId) {
  const [asignaciones, evaluaciones] = await Promise.all([
    prisma.asignacionTrabajador.findMany({
      where: { eventoId },
      orderBy: { createdAt: "asc" },
      include: {
        trabajador: {
          select: { id: true, nombre: true, rolPrincipal: true, activo: true, bloqueado: true },
        },
      },
    }),
    prisma.evaluacion.findMany({ where: { eventoId }, select: { id: true, trabajadorId: true } }),
  ]);

  const evaluacionPorTrabajador = new Map(evaluaciones.map((e) => [e.trabajadorId, e.id]));

  return asignaciones.map((a) => ({
    ...a,
    evaluada: evaluacionPorTrabajador.has(a.trabajadorId),
    evaluacionId: evaluacionPorTrabajador.get(a.trabajadorId) ?? null,
  }));
}

export async function listarAsignacionesPorTrabajador(trabajadorId) {
  const [asignaciones, evaluaciones] = await Promise.all([
    prisma.asignacionTrabajador.findMany({
      where: { trabajadorId },
      include: { evento: { select: { id: true, nombre: true, fecha: true, cancelado: true } } },
    }),
    prisma.evaluacion.findMany({ where: { trabajadorId }, select: { id: true, eventoId: true } }),
  ]);

  const evaluacionPorEvento = new Map(evaluaciones.map((e) => [e.eventoId, e.id]));

  return asignaciones
    .map((a) => ({
      ...a,
      finalizado: eventoFinalizado(a.evento),
      evaluada: evaluacionPorEvento.has(a.eventoId),
      evaluacionId: evaluacionPorEvento.get(a.eventoId) ?? null,
    }))
    .sort((a, b) => new Date(b.evento.fecha) - new Date(a.evento.fecha));
}

export async function eliminarAsignacion(id) {
  const asignacion = await prisma.asignacionTrabajador.findUnique({ where: { id } });
  if (!asignacion) throw httpError(404, "La asignación no existe.");

  const evaluacion = await prisma.evaluacion.findUnique({
    where: {
      trabajadorId_eventoId: { trabajadorId: asignacion.trabajadorId, eventoId: asignacion.eventoId },
    },
  });
  if (evaluacion) {
    throw httpError(409, "No se puede quitar la asignación: el trabajador ya fue evaluado en este evento.");
  }

  await prisma.asignacionTrabajador.delete({ where: { id } });
  return { id, eliminada: true };
}
