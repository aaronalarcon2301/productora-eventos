import prisma from "../config/prisma.js";
import { recalcularPromedioGeneral } from "./trabajador.service.js";

export async function crearEvaluacion(data) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: data.trabajadorId },
  });
  if (!trabajador) {
    throw httpError(404, "El trabajador no existe.");
  }
  if (trabajador.bloqueado) {
    
    throw httpError(409, "Este trabajador está bloqueado y no puede recibir nuevas evaluaciones.");
  }

  const evento = await prisma.evento.findUnique({ where: { id: data.eventoId } });
  if (!evento) {
    throw httpError(404, "El evento no existe.");
  }

  const criterios = [data.puntualidad, data.trato, data.eficiencia];
  if (data.manejoEquipos !== undefined) criterios.push(data.manejoEquipos);
  const promedioEvaluacion = Number(
    (criterios.reduce((suma, n) => suma + n, 0) / criterios.length).toFixed(2)
  );

  try {
    const evaluacion = await prisma.evaluacion.create({
      data: { ...data, promedioEvaluacion },
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