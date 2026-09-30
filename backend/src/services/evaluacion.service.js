import prisma from "../config/prisma.js";
import { recalcularPromedioGeneral } from "./trabajador.service.js";


const GRUPOS = {
  puntualidad: ["llegada", "cumplimientoHorarios", "tiemposPreparacion"],
  trato: ["comunicacion", "atencion", "conducta"],
  eficiencia: ["cumplimiento", "autonomia", "resolucion"],
  manejoEquipos: ["usoEquipos", "cuidadoEquipos", "resolucionTecnica"],
};

function promedio(valores) {
  return Number((valores.reduce((suma, n) => suma + n, 0) / valores.length).toFixed(2));
}

export async function crearEvaluacion(data) {
  const trabajador = await prisma.trabajador.findUnique({ where: { id: data.trabajadorId } });
  if (!trabajador) throw httpError(404, "El trabajador no existe.");
  if (trabajador.bloqueado) {
    throw httpError(409, "Este trabajador está bloqueado y no puede recibir nuevas evaluaciones.");
  }

  const evento = await prisma.evento.findUnique({ where: { id: data.eventoId } });
  if (!evento) throw httpError(404, "El evento no existe.");

  const promedioPuntualidad = promedio(GRUPOS.puntualidad.map((campo) => data[campo]));
  const promedioTrato = promedio(GRUPOS.trato.map((campo) => data[campo]));
  const promedioEficiencia = promedio(GRUPOS.eficiencia.map((campo) => data[campo]));

  const esTecnico = GRUPOS.manejoEquipos.every((campo) => data[campo] !== undefined);
  const promedioManejoEquipos = esTecnico
    ? promedio(GRUPOS.manejoEquipos.map((campo) => data[campo]))
    : null;

  const promediosCriterios = [promedioPuntualidad, promedioTrato, promedioEficiencia];
  if (promedioManejoEquipos !== null) promediosCriterios.push(promedioManejoEquipos);
  const promedioEvaluacion = promedio(promediosCriterios);

  try {
    const evaluacion = await prisma.evaluacion.create({
      data: {
        ...data,
        promedioPuntualidad,
        promedioTrato,
        promedioEficiencia,
        promedioManejoEquipos,
        promedioEvaluacion,
      },
    });
    await recalcularPromedioGeneral(data.trabajadorId);
    return evaluacion;
  } catch (err) {
    if (err.code === "P2002") {
      throw httpError(409, "Este trabajador ya tiene una evaluación registrada para este evento.");
    }
    throw err;
  }
}

export async function obtenerEvaluacionesPorTrabajador(trabajadorId) {
  return prisma.evaluacion.findMany({
    where: { trabajadorId },
    orderBy: { createdAt: "desc" },
    include: { evento: true },
  });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}