import prisma from "../config/prisma.js";
import { httpError } from "../utils/http.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { eventoFinalizado } from "../utils/fechas.js";
import { actualizarTrabajador } from "./trabajador.service.js";
import { obtenerEvaluacionesPorTrabajador } from "./evaluacion.service.js";

async function trabajadorDeSesion(usuarioId) {
  const trabajador = await prisma.trabajador.findFirst({
    where: { usuarioId },
    include: { disponibilidades: { select: { dia: true } } },
  });
  if (!trabajador) {
    throw httpError(404, "Tu cuenta no está vinculada a ningún trabajador. Avisa al gerente.");
  }
  if (!trabajador.activo) {
    throw httpError(403, "Tu ficha de trabajador está inactiva. Avisa al gerente.");
  }
  return trabajador;
}

function perfilSeguro(t) {
  return {
    id: t.id,
    nombre: t.nombre,
    rolPrincipal: t.rolPrincipal,
    email: t.email,
    telefono: t.telefono,
    comuna: t.comuna,
    aniosExperiencia: t.aniosExperiencia,
    tallaUniforme: t.tallaUniforme,
    disponibilidadTurno: t.disponibilidadTurno,
    disponibilidadDias: t.disponibilidadDias ?? (t.disponibilidades ?? []).map((d) => d.dia),
    promedioGeneral: t.promedioGeneral,
    bloqueado: t.bloqueado,
  };
}

export async function obtenerPerfil(usuarioId) {
  return perfilSeguro(await trabajadorDeSesion(usuarioId));
}

export async function actualizarPerfil(usuarioId, datos) {
  const trabajador = await trabajadorDeSesion(usuarioId);
  const actualizado = await actualizarTrabajador(trabajador.id, datos);
  return perfilSeguro(actualizado);
}

export async function cambiarPassword(usuarioId, tokenHashActual, { passwordActual, passwordNueva }) {
  await trabajadorDeSesion(usuarioId);

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario || !(await verifyPassword(passwordActual, usuario.passwordHash))) {
    // 400 y no 401: un 401 haría que la pantalla cierre la sesión.
    throw httpError(400, "La contraseña actual no es correcta.");
  }

  const passwordHash = await hashPassword(passwordNueva);

  await prisma.$transaction([
    prisma.usuario.update({ where: { id: usuarioId }, data: { passwordHash } }),
    // Cierra las otras sesiones abiertas; la actual sigue activa.
    prisma.sesion.deleteMany({ where: { usuarioId, tokenHash: { not: tokenHashActual } } }),
  ]);

  return { mensaje: "Tu contraseña se cambió." };
}

export async function listarAsignaciones(usuarioId) {
  const trabajador = await trabajadorDeSesion(usuarioId);

  const [asignaciones, evaluaciones] = await Promise.all([
    prisma.asignacionTrabajador.findMany({
      where: { trabajadorId: trabajador.id },
      include: {
        evento: {
          select: {
            id: true,
            nombre: true,
            fecha: true,
            cancelado: true,
            finalizadoAt: true,
            lugar: { select: { nombre: true } },
          },
        },
      },
    }),
    prisma.evaluacion.findMany({ where: { trabajadorId: trabajador.id }, select: { eventoId: true } }),
  ]);

  const evaluados = new Set(evaluaciones.map((e) => e.eventoId));

  return asignaciones
    .map((a) => ({
      id: a.id,
      rol: a.rol,
      respuesta: a.respuesta,
      respondidaAt: a.respondidaAt,
      comentarioRespuesta: a.comentarioRespuesta,
      evento: {
        id: a.evento.id,
        nombre: a.evento.nombre,
        fecha: a.evento.fecha,
        cancelado: a.evento.cancelado,
        lugar: a.evento.lugar?.nombre ?? null,
      },
      finalizado: eventoFinalizado(a.evento),
      evaluada: evaluados.has(a.eventoId),
    }))
    .sort((a, b) => new Date(b.evento.fecha) - new Date(a.evento.fecha));
}

export async function responderAsignacion(usuarioId, asignacionId, { respuesta, comentario }) {
  const trabajador = await trabajadorDeSesion(usuarioId);

  const asignacion = await prisma.asignacionTrabajador.findFirst({
    where: { id: asignacionId, trabajadorId: trabajador.id },
    include: { evento: true },
  });
  if (!asignacion) throw httpError(404, "La asignación no existe.");
  if (asignacion.evento.cancelado) throw httpError(409, "El evento está cancelado.");
  if (eventoFinalizado(asignacion.evento)) {
    throw httpError(409, "El evento ya finalizó: no se puede cambiar la respuesta.");
  }

  const actualizada = await prisma.asignacionTrabajador.update({
    where: { id: asignacionId },
    data: {
      respuesta,
      respondidaAt: new Date(),
      comentarioRespuesta: respuesta === "RECHAZADA" ? comentario ?? null : null,
    },
  });

  return {
    id: actualizada.id,
    respuesta: actualizada.respuesta,
    respondidaAt: actualizada.respondidaAt,
    comentarioRespuesta: actualizada.comentarioRespuesta,
  };
}

export async function listarEvaluaciones(usuarioId) {
  const trabajador = await trabajadorDeSesion(usuarioId);
  const evaluaciones = await obtenerEvaluacionesPorTrabajador(trabajador.id);

  return evaluaciones.map(({ adminId, modificadoPorId, trabajadorId, evento, ...resto }) => ({
    ...resto,
    evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha },
  }));
}
