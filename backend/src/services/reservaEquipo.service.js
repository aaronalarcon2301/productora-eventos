import prisma from "../config/prisma.js";
import { httpError } from "../utils/http.js";
import { eventoFinalizado } from "../utils/fechas.js";
import {
  unidadesReservadasPorEquipo,
  unidadesOperativas,
  formatearFechaCorta,
} from "./equipo.service.js";

const INCLUIR = { equipo: true, responsable: true };

// Bloquea la fila del equipo hasta terminar la transacción, para que dos reservas
// simultáneas no se lleven las mismas unidades.
async function bloquearEquipo(tx, equipoId) {
  await tx.$queryRaw`SELECT id FROM equipos WHERE id = ${equipoId} FOR UPDATE`;
}

async function validarResponsable(db, responsableId, eventoId) {
  const asignacion = await db.asignacionTrabajador.findFirst({
    where: { trabajadorId: responsableId, eventoId },
    include: { trabajador: true },
  });
  if (!asignacion) {
    throw httpError(409, "El responsable debe ser un trabajador asignado a este evento.");
  }
  if (asignacion.trabajador.bloqueado || !asignacion.trabajador.activo) {
    throw httpError(409, "El responsable está inactivo o bloqueado y no puede quedar a cargo de equipos.");
  }
}

export async function crearReserva({ equipoId, eventoId, cantidad, responsableId }) {
  return prisma.$transaction(async (tx) => {
    await bloquearEquipo(tx, equipoId);

    const equipo = await tx.equipo.findUnique({ where: { id: equipoId } });
    if (!equipo) throw httpError(404, "El equipo no existe.");
    if (!equipo.activo) throw httpError(409, "Este equipo está desactivado y no se puede reservar.");

    const evento = await tx.evento.findUnique({ where: { id: eventoId } });
    if (!evento) throw httpError(404, "El evento no existe.");
    if (evento.cancelado) throw httpError(409, "No se pueden reservar equipos para un evento cancelado.");
    if (eventoFinalizado(evento)) throw httpError(409, "No se pueden reservar equipos para un evento que ya finalizó.");

    if (responsableId) await validarResponsable(tx, responsableId, eventoId);

    const otros = (await unidadesReservadasPorEquipo(evento.fecha, { excluirEventoId: eventoId, db: tx })).get(equipoId) ?? 0;
    const disponible = unidadesOperativas(equipo) - otros;

    if (cantidad > disponible) {
      const partes = [`otros eventos usan ${otros}`];
      if (equipo.cantidadMantencion > 0) partes.push(`${equipo.cantidadMantencion} están en mantención`);
      throw httpError(
        409,
        `Solo hay ${Math.max(0, disponible)} unidad(es) disponible(s) de "${equipo.nombre}" el ${formatearFechaCorta(evento.fecha)} ` +
          `(${partes.join(" y ")}). Faltan ${cantidad - Math.max(0, disponible)}.`
      );
    }

    try {
      return await tx.reservaEquipo.create({
        data: { equipoId, eventoId, cantidad, responsableId: responsableId ?? null },
        include: INCLUIR,
      });
    } catch (err) {
      if (err.code === "P2002") throw httpError(409, "Este equipo ya está reservado para este evento.");
      throw err;
    }
  });
}

export async function listarReservasPorEvento(eventoId) {
  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) throw httpError(404, "El evento no existe.");

  const reservas = await prisma.reservaEquipo.findMany({ where: { eventoId }, include: INCLUIR });
  return reservas.sort((a, b) => a.equipo.nombre.localeCompare(b.equipo.nombre, "es"));
}

export async function eliminarReserva(id) {
  const reserva = await prisma.reservaEquipo.findUnique({ where: { id } });
  if (!reserva) throw httpError(404, "La reserva no existe.");
  if (reserva.estado !== "RESERVADO") {
    throw httpError(409, "No se puede quitar: el equipo ya fue entregado o devuelto.");
  }
  await prisma.reservaEquipo.delete({ where: { id } });
  return { id, eliminada: true };
}

export async function registrarEntrega(id) {
  const reserva = await prisma.reservaEquipo.findUnique({ where: { id }, include: { evento: true } });
  if (!reserva) throw httpError(404, "La reserva no existe.");
  if (reserva.evento.cancelado) throw httpError(409, "El evento está cancelado: no se pueden entregar equipos.");
  if (reserva.estado !== "RESERVADO") throw httpError(409, "Este equipo ya fue entregado.");

  return prisma.reservaEquipo.update({
    where: { id },
    data: { estado: "ENTREGADO", entregadaAt: new Date() },
    include: INCLUIR,
  });
}

// Registra lo que volvió: las unidades dañadas pasan a mantención y las faltantes
// se descuentan del stock total. El resto vuelve a quedar disponible.
export async function registrarDevolucion(id, { cantidadDanada = 0, cantidadFaltante = 0, observacion }) {
  return prisma.$transaction(async (tx) => {
    const previa = await tx.reservaEquipo.findUnique({ where: { id } });
    if (!previa) throw httpError(404, "La reserva no existe.");
    await bloquearEquipo(tx, previa.equipoId);

    const reserva = await tx.reservaEquipo.findUnique({ where: { id }, include: { equipo: true } });
    if (reserva.estado === "RESERVADO") throw httpError(409, "Primero debes registrar la entrega de este equipo.");
    if (reserva.estado === "DEVUELTO") throw httpError(409, "Este equipo ya fue devuelto.");

    if (cantidadDanada + cantidadFaltante > reserva.cantidad) {
      throw httpError(
        400,
        `Entre dañadas y faltantes no pueden superar las ${reserva.cantidad} unidades entregadas.`
      );
    }
    if ((cantidadDanada > 0 || cantidadFaltante > 0) && !observacion) {
      throw httpError(400, "Describe el daño o el faltante en la observación.");
    }

    const { equipo } = reserva;
    const nuevoTotal = equipo.cantidadTotal - cantidadFaltante;
    const nuevaMantencion = Math.min(equipo.cantidadMantencion + cantidadDanada, nuevoTotal);
    if (cantidadDanada > 0 || cantidadFaltante > 0) {
      await tx.equipo.update({
        where: { id: equipo.id },
        data: { cantidadTotal: nuevoTotal, cantidadMantencion: nuevaMantencion },
      });
    }

    return tx.reservaEquipo.update({
      where: { id },
      data: {
        estado: "DEVUELTO",
        devueltaAt: new Date(),
        cantidadDanada,
        cantidadFaltante,
        observacion: observacion ?? null,
      },
      include: INCLUIR,
    });
  });
}
