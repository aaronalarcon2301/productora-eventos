import prisma from "../config/prisma.js";


export async function recalcularPromedioGeneral(trabajadorId) {
  const evaluaciones = await prisma.evaluacion.findMany({
    where: { trabajadorId },
    select: { promedioEvaluacion: true },
  });

  if (evaluaciones.length === 0) return;

  const promedioGeneral =
    evaluaciones.reduce((suma, e) => suma + e.promedioEvaluacion, 0) / evaluaciones.length;

  await prisma.trabajador.update({
    where: { id: trabajadorId },
    data: { promedioGeneral },
  });
}


export async function listarTrabajadores() {
  return prisma.trabajador.findMany({
    orderBy: { nombre: "asc" },
  });
}

export async function obtenerHistorial(trabajadorId) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: trabajadorId },
    include: {
      evaluaciones: { orderBy: { createdAt: "desc" } },
      incidentes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!trabajador) return null;

  const notasPorRol = {};
  for (const ev of trabajador.evaluaciones) {
    if (!notasPorRol[ev.rolEvento]) notasPorRol[ev.rolEvento] = [];
    notasPorRol[ev.rolEvento].push(ev.promedioEvaluacion);
  }

  const promedioPorRol = {};
  for (const rol in notasPorRol) {
    const notas = notasPorRol[rol];
    promedioPorRol[rol] = Number(
      (notas.reduce((suma, n) => suma + n, 0) / notas.length).toFixed(2)
    );
  }

  return {
    id: trabajador.id,
    nombre: trabajador.nombre,
    rolPrincipal: trabajador.rolPrincipal,
    bloqueado: trabajador.bloqueado,
    promedioGeneral: trabajador.promedioGeneral,
    promedioPorRol,
    totalEvaluaciones: trabajador.evaluaciones.length,
    totalIncidentes: trabajador.incidentes.length,
    disponibleParaContratar: !trabajador.bloqueado,
  };
}