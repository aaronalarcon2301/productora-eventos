import prisma from "../config/prisma.js";

export async function crearIncidente(data) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: data.trabajadorId },
  });
  if (!trabajador) {
    const error = new Error("El trabajador no existe.");
    error.status = 404;
    throw error;
  }

  const incidente = await prisma.incidente.create({ data });

  if (data.tipo === "FALTA_GRAVE") {
    await prisma.trabajador.update({
      where: { id: data.trabajadorId },
      data: { bloqueado: true },
    });
  }

  return incidente;
}

export async function listarIncidentesPorTrabajador(trabajadorId) {
  return prisma.incidente.findMany({
    where: { trabajadorId },
    orderBy: { createdAt: "desc" },
    include: { evento: true },
  });
}