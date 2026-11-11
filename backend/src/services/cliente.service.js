import prisma from '../config/prisma.js';
import { httpError } from '../utils/http.js';
import { eventoFinalizado } from '../utils/fechas.js';

const CAMPOS_UNICOS = { rut: 'RUT', email: 'email' };

function traducirDuplicado(error) {
  if (error.code !== 'P2002') return error;
  const campos = [].concat(error.meta?.target ?? []);
  const campo = campos.map((c) => CAMPOS_UNICOS[c]).find(Boolean);
  return httpError(409, campo ? `Ya existe un cliente con ese ${campo}.` : 'Ya existe un cliente con esos datos.');
}

export const getAllClientes = () => {
  return prisma.cliente
    .findMany({
      include: {
        _count: { select: { eventos: true } },
        eventos: { select: { id: true, nombre: true, fecha: true, presupuesto: true, cancelado: true } },
      },
      orderBy: { nombre: 'asc' },
    });
};

export const getClienteById = (id) => {
  return prisma.cliente
    .findUnique({
      where: { id },
      include: {
        eventos: {
          include: { lugar: true, _count: { select: { reclamos: true } } },
          orderBy: { fecha: 'desc' },
        },
      },
    })
    .then((cliente) =>
      cliente
        ? { ...cliente, eventos: cliente.eventos.map((e) => ({ ...e, finalizado: eventoFinalizado(e) })) }
        : cliente
    );
};

export const createCliente = async (data) => {
  try {
    return await prisma.cliente.create({ data });
  } catch (error) {
    throw traducirDuplicado(error);
  }
};

export const updateCliente = async (id, data) => {
  try {
    return await prisma.cliente.update({ where: { id }, data });
  } catch (error) {
    throw traducirDuplicado(error);
  }
};

export const deleteCliente = async (id) => {
  const eventos = await prisma.evento.count({ where: { clienteId: id } });
  if (eventos > 0) {
    throw httpError(
      409,
      `No se puede eliminar: el cliente tiene ${eventos} evento${eventos === 1 ? '' : 's'} registrado${eventos === 1 ? '' : 's'}.`
    );
  }
  return prisma.cliente.delete({ where: { id } });
};
