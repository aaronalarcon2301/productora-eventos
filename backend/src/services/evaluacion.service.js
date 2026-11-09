import prisma from "../config/prisma.js";
import { recalcularPromedioGeneral } from "./trabajador.service.js";
import {
  SUBINDICADORES_BASE,
  SUBINDICADORES_TECNICOS,
  esRolTecnico,
} from "../schemas/evaluacion.schema.js";
import { httpError } from "../utils/http.js";
import { eventoFinalizado } from "../utils/fechas.js";

const GRUPOS = {
  puntualidad: ["llegada", "cumplimientoHorarios", "tiemposPreparacion"],
  trato: ["comunicacion", "atencion", "conducta"],
  eficiencia: ["cumplimiento", "autonomia", "resolucion"],
  manejoEquipos: ["usoEquipos", "cuidadoEquipos", "resolucionTecnica"],
};

function promedio(valores) {
  return Number((valores.reduce((suma, n) => suma + n, 0) / valores.length).toFixed(2));
}

// Arma las columnas de la evaluación (notas, comentarios y promedios) a partir del
// cuerpo validado. Los comentarios ausentes se guardan como null, así al editar
// una evaluación se limpian los comentarios que el administrador quitó.
function construirDatosEvaluacion(data) {
  const tecnico = esRolTecnico(data.rolEvento);
  const campos = { rolEvento: data.rolEvento };

  for (const [nota, comentario] of SUBINDICADORES_BASE) {
    campos[nota] = data[nota];
    campos[comentario] = data[comentario] ?? null;
  }
  for (const [nota, comentario] of SUBINDICADORES_TECNICOS) {
    campos[nota] = tecnico ? data[nota] : null;
    campos[comentario] = tecnico ? data[comentario] ?? null : null;
  }

  const promedioPuntualidad = promedio(GRUPOS.puntualidad.map((c) => data[c]));
  const promedioTrato = promedio(GRUPOS.trato.map((c) => data[c]));
  const promedioEficiencia = promedio(GRUPOS.eficiencia.map((c) => data[c]));
  const promedioManejoEquipos = tecnico
    ? promedio(GRUPOS.manejoEquipos.map((c) => data[c]))
    : null;

  const promediosCriterios = [promedioPuntualidad, promedioTrato, promedioEficiencia];
  if (promedioManejoEquipos !== null) promediosCriterios.push(promedioManejoEquipos);

  return {
    ...campos,
    promedioPuntualidad,
    promedioTrato,
    promedioEficiencia,
    promedioManejoEquipos,
    promedioEvaluacion: promedio(promediosCriterios),
  };
}

async function obtenerEvaluacionOFallar(id) {
  const evaluacion = await prisma.evaluacion.findUnique({ where: { id } });
  if (!evaluacion) throw httpError(404, "La evaluación no existe.");
  return evaluacion;
}

// Copia serializable de la evaluación para guardarla en la bitácora (las fechas pasan a texto).
function instantanea(evaluacion) {
  return JSON.parse(JSON.stringify(evaluacion));
}

export async function crearEvaluacion(data) {
  const trabajador = await prisma.trabajador.findUnique({ where: { id: data.trabajadorId } });
  if (!trabajador) throw httpError(404, "El trabajador no existe.");
  if (trabajador.bloqueado) {
    throw httpError(409, "Este trabajador está bloqueado y no puede recibir nuevas evaluaciones.");
  }

  const evento = await prisma.evento.findUnique({ where: { id: data.eventoId } });
  if (!evento) throw httpError(404, "El evento no existe.");
  if (evento.cancelado) {
    throw httpError(409, "No se puede evaluar a un trabajador en un evento cancelado.");
  }

  // Regla: la evaluación solo se habilita cuando el evento ya finalizó.
  if (!eventoFinalizado(evento)) {
    throw httpError(409, "El evento aún no finaliza: la evaluación se habilita cuando termine.");
  }

  // Regla: solo se evalúa a quien estuvo asignado al evento, con el rol que tuvo en él.
  const asignacion = await prisma.asignacionTrabajador.findUnique({
    where: { trabajadorId_eventoId: { trabajadorId: data.trabajadorId, eventoId: data.eventoId } },
  });
  if (!asignacion) {
    throw httpError(409, "El trabajador no fue asignado a este evento, por lo que no puede evaluarse.");
  }
  if (asignacion.rol !== data.rolEvento) {
    throw httpError(
      409,
      `El rol evaluado (${data.rolEvento}) no coincide con el rol asignado en el evento (${asignacion.rol}).`
    );
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const evaluacion = await tx.evaluacion.create({
        data: {
          trabajadorId: data.trabajadorId,
          eventoId: data.eventoId,
          adminId: data.adminId,
          ...construirDatosEvaluacion(data),
        },
      });
      await recalcularPromedioGeneral(data.trabajadorId, tx);
      return evaluacion;
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw httpError(409, "Este trabajador ya tiene una evaluación registrada para este evento.");
    }
    throw err;
  }
}

// Editar: vuelve a aplicar las mismas validaciones (ya hechas por el schema),
// recalcula promedios y deja registro de quién y qué se cambió.
export async function actualizarEvaluacion(id, data) {
  const existente = await obtenerEvaluacionOFallar(id);

  if (existente.trabajadorId !== data.trabajadorId || existente.eventoId !== data.eventoId) {
    throw httpError(400, "No se puede cambiar el trabajador ni el evento de una evaluación.");
  }
  if (existente.rolEvento !== data.rolEvento) {
    throw httpError(400, "No se puede cambiar el rol evaluado de una evaluación.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.auditoriaEvaluacion.create({
      data: {
        evaluacionId: id,
        trabajadorId: existente.trabajadorId,
        eventoId: existente.eventoId,
        accion: "EDITADA",
        motivo: data.motivo ?? null,
        adminId: data.adminId ?? null,
        datosAnteriores: instantanea(existente),
      },
    });

    const actualizada = await tx.evaluacion.update({
      where: { id },
      data: { ...construirDatosEvaluacion(data), modificadoPorId: data.adminId ?? null },
    });

    await recalcularPromedioGeneral(existente.trabajadorId, tx);
    return actualizada;
  });
}

// Eliminar: exige motivo (lo valida el schema), guarda copia en la bitácora y recalcula promedios.
export async function eliminarEvaluacion(id, { motivo, adminId }) {
  const existente = await obtenerEvaluacionOFallar(id);

  return prisma.$transaction(async (tx) => {
    await tx.auditoriaEvaluacion.create({
      data: {
        evaluacionId: id,
        trabajadorId: existente.trabajadorId,
        eventoId: existente.eventoId,
        accion: "ELIMINADA",
        motivo,
        adminId: adminId ?? null,
        datosAnteriores: instantanea(existente),
      },
    });

    await tx.evaluacion.delete({ where: { id } });
    await recalcularPromedioGeneral(existente.trabajadorId, tx);
    return { id, eliminada: true };
  });
}

export async function obtenerEvaluacionesPorTrabajador(trabajadorId) {
  return prisma.evaluacion.findMany({
    where: { trabajadorId },
    orderBy: { createdAt: "desc" },
    include: { evento: true },
  });
}
