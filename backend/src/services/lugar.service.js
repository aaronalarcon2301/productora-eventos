import prisma from '../config/prisma.js';

export const getAllLugares = () => {
  return prisma.lugar.findMany({
    include: { _count: { select: { eventos: true } } },
  });
};

export const getLugarById = (id) => {
  return prisma.lugar.findUnique({
    where: { id },
    include: { eventos: true },
  });
};

export const createLugar = (data) => {
  return prisma.lugar.create({ data });
};

export const updateLugar = (id, data) => {
  return prisma.lugar.update({ where: { id }, data });
};

export const deleteLugar = (id) => {
  return prisma.lugar.delete({ where: { id } });
};