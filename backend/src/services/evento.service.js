import prisma from '../config/prisma.js';
import { eventoFinalizado } from '../utils/fechas.js';

const conEstado = (evento) => (evento ? { ...evento, finalizado: eventoFinalizado(evento) } : evento);

export const getAllEventos = (filtros = {}, usuario) => {
  const where = {};

  if (usuario?.rol === 'TRABAJADOR') {
    where.estadoPresupuesto = 'APROBADO';
  }

  if (filtros.clienteId) {
    where.clienteId = Number(filtros.clienteId);
  }

  if (filtros.lugarId) {
    where.lugarId = Number(filtros.lugarId);
  }

  return prisma.evento
    .findMany({
      where,
      include: {
        cliente: true,
        lugar: true
      }
    })
    .then(eventos => eventos.map(conEstado));
};

export const getEventoById = (id, usuario) => {
  return prisma.evento
    .findFirst({
      where: {
        id: Number(id),
        ...(usuario?.rol === 'TRABAJADOR'
          ? { estadoPresupuesto: 'APROBADO' }
          : {})
      },
      include: {
        cliente: true,
        lugar: true
      }
    })
    .then(conEstado);
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

export const eventoExists = async (id) => {
  const evento = await prisma.evento.findUnique({ where: { id } });
  return evento !== null;
};

export const contarDiasHabiles = (fechaInicio, fechaFin) => {
  let contador = 0;
  const actual = new Date(fechaInicio);
  actual.setUTCDate(actual.getUTCDate() + 1);

  while (actual <= fechaFin) {
    const diaSemana = actual.getUTCDay(); 
    if (diaSemana !== 0 && diaSemana !== 6) contador++;
    actual.setUTCDate(actual.getUTCDate() + 1);
  }

  return contador;
};

export const calcularDevolucion = async (evento, fechaSolicitud) => {
  const diasHabiles = contarDiasHabiles(evento.fechaPago, fechaSolicitud);

  const politicas = await prisma.politicaDevolucion.findMany();

  let porcentajeAplicar = 0;
  for (const tramo of politicas) {
    const superaMinimo = diasHabiles >= tramo.diasDesde;
    const bajoMaximo = tramo.diasHasta === null || diasHabiles <= tramo.diasHasta;

    if (superaMinimo && bajoMaximo) {
      porcentajeAplicar = tramo.porcentaje;
      break;
    }
  }

  const decimalPorcentaje = porcentajeAplicar / 100;
  const montoDevolucion = Math.round(evento.montoAbono * decimalPorcentaje);

  return {
    diasHabiles,
    porcentaje: decimalPorcentaje,
    montoDevolucion
  };
};

export const cancelarEvento = (id, fechaCancelacion, montoDevolucion) => {
  return prisma.evento.update({
    where: { id },
    data: {
      cancelado: true,
      confirmado: false,
      fechaCancelacion,
      montoDevolucion,
    },
    include: { cliente: true, lugar: true },
  });
};