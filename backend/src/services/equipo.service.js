import prisma from "../config/prisma.js";
import { httpError } from "../utils/http.js";
import { inicioDelDia, finDelDia } from "../utils/fechas.js";

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function formatearFechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString("es-CL", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// "2026-11-14" -> Date (medianoche UTC). Sin valor -> hoy.
export function parseFechaConsulta(valor) {
  if (valor === undefined || valor === "") return new Date();
  if (!FECHA_ISO.test(valor) || Number.isNaN(new Date(valor).getTime())) {
    throw httpError(400, "La fecha debe tener el formato AAAA-MM-DD.");
  }
  return new Date(`${valor}T12:00:00.000Z`);
}

// Unidades de cada equipo que están comprometidas en eventos de un día:
// reservas de eventos NO cancelados que todavía no fueron devueltas.
// Un evento cancelado libera sus equipos automáticamente (no se cuenta).
export async function unidadesReservadasPorEquipo(fecha, { excluirEventoId, db = prisma } = {}) {
  const where = {
    estado: { not: "DEVUELTO" },
    evento: { cancelado: false, fecha: { gte: inicioDelDia(fecha), lt: finDelDia(fecha) } },
  };
  if (excluirEventoId) where.eventoId = { not: excluirEventoId };

  const reservas = await db.reservaEquipo.findMany({ where });
  const mapa = new Map();
  for (const r of reservas) mapa.set(r.equipoId, (mapa.get(r.equipoId) ?? 0) + r.cantidad);
  return mapa;
}

export function unidadesOperativas(equipo) {
  return equipo.cantidadTotal - equipo.cantidadMantencion;
}

export function calcularEstadoStock(equipo, disponible) {
  if (!equipo.activo) return "INACTIVO";
  const operativas = unidadesOperativas(equipo);
  if (operativas <= 0) return "EN_MANTENCION";
  if (disponible <= 0) return "AGOTADO";
  if (disponible <= Math.ceil(operativas * 0.25)) return "POCAS";
  return "DISPONIBLE";
}

// Lista el catálogo con la disponibilidad de un día.
//   ?fecha=AAAA-MM-DD   -> disponibilidad de ese día (por defecto hoy)
//   ?eventoId=N         -> disponibilidad en la fecha de ese evento, sin contar sus propias reservas
//   ?soloActivos=true   -> oculta los equipos desactivados
export async function listarEquipos({ fecha, eventoId, soloActivos } = {}) {
  let fechaConsulta;
  if (eventoId) {
    const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
    if (!evento) throw httpError(404, "El evento no existe.");
    fechaConsulta = evento.fecha;
  } else {
    fechaConsulta = parseFechaConsulta(fecha);
  }

  const [equipos, reservado] = await Promise.all([
    prisma.equipo.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    }),
    unidadesReservadasPorEquipo(fechaConsulta, { excluirEventoId: eventoId }),
  ]);

  return equipos.map((e) => {
    const reservadoDia = reservado.get(e.id) ?? 0;
    const disponible = Math.max(0, unidadesOperativas(e) - reservadoDia);
    return { ...e, reservadoDia, disponible, estadoStock: calcularEstadoStock(e, disponible) };
  });
}

export async function obtenerEquipo(id) {
  const equipo = await prisma.equipo.findUnique({ where: { id } });
  if (!equipo) throw httpError(404, "El equipo no existe.");

  const reservas = await prisma.reservaEquipo.findMany({
    where: { equipoId: id },
    include: { evento: true, responsable: true },
  });
  const historial = reservas
    .map((r) => ({
      id: r.id,
      cantidad: r.cantidad,
      estado: r.estado,
      cantidadDanada: r.cantidadDanada,
      cantidadFaltante: r.cantidadFaltante,
      observacion: r.observacion,
      evento: { id: r.evento.id, nombre: r.evento.nombre, fecha: r.evento.fecha, cancelado: r.evento.cancelado },
      responsable: r.responsable ? { id: r.responsable.id, nombre: r.responsable.nombre } : null,
    }))
    .sort((a, b) => new Date(b.evento.fecha) - new Date(a.evento.fecha));

  return { ...equipo, historial };
}

async function validarNombreLibre(nombre, idActual) {
  const existente = await prisma.equipo.findFirst({ where: { nombre } });
  if (existente && existente.id !== idActual) {
    throw httpError(409, `Ya existe un equipo llamado "${nombre}".`);
  }
}

export async function crearEquipo(data) {
  await validarNombreLibre(data.nombre);
  try {
    return await prisma.equipo.create({ data });
  } catch (err) {
    if (err.code === "P2002") throw httpError(409, `Ya existe un equipo llamado "${data.nombre}".`);
    throw err;
  }
}

// Reservas que todavía comprometen unidades (sin devolver, en eventos no cancelados).
async function reservasVigentes(equipoId, db = prisma) {
  return db.reservaEquipo.findMany({
    where: { equipoId, estado: { not: "DEVUELTO" }, evento: { cancelado: false } },
    include: { evento: true },
  });
}

export async function actualizarEquipo(id, data) {
  const equipo = await prisma.equipo.findUnique({ where: { id } });
  if (!equipo) throw httpError(404, "El equipo no existe.");

  if (data.nombre !== undefined && data.nombre !== equipo.nombre) await validarNombreLibre(data.nombre, id);

  const nuevo = { ...equipo, ...data };
  if (nuevo.cantidadMantencion > nuevo.cantidadTotal) {
    throw httpError(400, "Las unidades en mantención no pueden superar la cantidad total.");
  }

  const vigentes = await reservasVigentes(id);

  if (data.activo === false && equipo.activo && vigentes.length > 0) {
    throw httpError(
      409,
      `No se puede desactivar: el equipo tiene ${vigentes.length} reserva(s) vigente(s) en eventos. Quítalas o devuélvelas primero.`
    );
  }

  // Si se reduce el stock operativo, no puede quedar por debajo de lo ya comprometido en un mismo día.
  if (unidadesOperativas(nuevo) < unidadesOperativas(equipo)) {
    const porDia = new Map();
    for (const r of vigentes) {
      const dia = inicioDelDia(r.evento.fecha).toISOString();
      porDia.set(dia, (porDia.get(dia) ?? 0) + r.cantidad);
    }
    for (const [dia, usadas] of porDia) {
      if (usadas > unidadesOperativas(nuevo)) {
        throw httpError(
          409,
          `No se puede dejar solo ${unidadesOperativas(nuevo)} unidad(es) operativa(s): el ${formatearFechaCorta(dia)} ya hay ${usadas} reservada(s).`
        );
      }
    }
  }

  try {
    return await prisma.equipo.update({ where: { id }, data });
  } catch (err) {
    if (err.code === "P2002") throw httpError(409, `Ya existe un equipo llamado "${data.nombre}".`);
    throw err;
  }
}

// Si el equipo nunca se usó se borra; si tiene historial, se desactiva (baja lógica).
export async function eliminarEquipo(id) {
  const equipo = await prisma.equipo.findUnique({ where: { id } });
  if (!equipo) throw httpError(404, "El equipo no existe.");

  const reservas = await prisma.reservaEquipo.findMany({ where: { equipoId: id } });

  if (reservas.length === 0) {
    await prisma.equipo.delete({ where: { id } });
    return { accion: "ELIMINADO", mensaje: "Equipo eliminado correctamente." };
  }

  const vigentes = await reservasVigentes(id);
  if (vigentes.length > 0) {
    throw httpError(
      409,
      `No se puede eliminar ni desactivar: el equipo tiene ${vigentes.length} reserva(s) vigente(s) en eventos. Quítalas o devuélvelas primero.`
    );
  }

  await prisma.equipo.update({ where: { id }, data: { activo: false } });
  return {
    accion: "INACTIVADO",
    mensaje: "El equipo tiene historial de uso, por lo que no se eliminó: quedó desactivado y conserva su historial.",
  };
}
