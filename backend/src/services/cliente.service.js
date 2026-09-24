import prisma from '../config/prisma.js';

export const getAllClientes = () => {
  return prisma.cliente.findMany({
    include: { _count: { select: { eventos: true } } },
  });
};

export const getClienteById = (id) => {
  return prisma.cliente.findUnique({
    where: { id },
    include: { eventos: true },
  });
};

export const createCliente = (data) => {
  return prisma.cliente.create({ data });
};

export const updateCliente = (id, data) => {
  return prisma.cliente.update({ where: { id }, data });
};

export const deleteCliente = (id) => {
  return prisma.cliente.delete({ where: { id } });
};