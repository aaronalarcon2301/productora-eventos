import prisma from '../config/prisma.js';

export const getAllEventos = (filtros = {}) => {
  const where = {};
  if (filtros.clienteId) where.clienteId = filtros.clienteId;
  if (filtros.lugarId) where.lugarId = filtros.lugarId;

  return prisma.evento.findMany({
    where,
    include: { cliente: true, lugar: true },
  });
};

export const getEventoById = (id) => {
  return prisma.evento.findUnique({
    where: { id },
    include: { cliente: true, lugar: true },
  });
};

export const createEvento = (data) => {
  return prisma.evento.create({ data });
};

export const updateEvento = (id, data) => {
  return prisma.evento.update({ where: { id }, data });
};

export const deleteEvento = (id) => {
  return prisma.evento.delete({ where: { id } });
};

// Reutilizado por reclamo.service.js para verificar que el evento exista
export const eventoExists = async (id) => {
  const evento = await prisma.evento.findUnique({ where: { id } });
  return evento !== null;
};