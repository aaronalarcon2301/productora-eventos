import prisma from '../config/prisma.js';

export const getReclamosByEvento = async (eventoId) => {
  const reclamos = await prisma.reclamo.findMany({
    where: { eventoId },
    orderBy: { createdAt: 'desc' },
  });

  const promedio = await prisma.reclamo.aggregate({
    where: { eventoId },
    _avg: { calificacion: true },
  });

  return {
    reclamos,
    averageRating: promedio._avg.calificacion ?? null,
  };
};

export const createReclamo = (eventoId, data) => {
  return prisma.reclamo.create({
    data: { ...data, eventoId },
  });
};