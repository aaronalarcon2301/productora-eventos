
import prisma from '../config/prisma.js';

import {
  eventoFinalizado
} from '../utils/fechas.js';

import {
  contarDiasHabiles,
  buscarTramo,
  hoyChile
} from '../utils/devolucion.js';

const conEstado = evento => (
  evento
    ? {
        ...evento,
        finalizado: eventoFinalizado(evento)
      }
    : evento
);

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
          ? {
              estadoPresupuesto: 'APROBADO'
            }
          : {})
      },

      include: {
        cliente: true,
        lugar: true
      }
    })
    .then(conEstado);
};

export const createEvento = data => {
  return prisma.evento.create({
    data
  });
};

export const updateEvento = (id, data) => {
  return prisma.evento.update({
    where: { id },
    data
  });
};

export const deleteEvento = id => {
  return prisma.evento.delete({
    where: { id }
  });
};

export const eventoExists = async id => {
  const evento = await prisma.evento.findUnique({
    where: { id }
  });

  return evento !== null;
};

export { contarDiasHabiles };

export function validarEventoParaDevolucion(
  evento,
  fechaSolicitud
) {
  const problema = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    throw error;
  };

  if (!evento) {
    problema(404, 'Evento no encontrado.');
  }

  if (evento.cancelado) {
    problema(409, 'El evento ya fue cancelado.');
  }

  if (!evento.confirmado) {
    problema(
      409,
      'Solo se pueden cancelar eventos confirmados.'
    );
  }

  if (
    !evento.fechaPago ||
    !Number.isFinite(evento.montoAbono) ||
    evento.montoAbono <= 0
  ) {
    problema(
      409,
      'Debes registrar un abono válido antes de calcular la devolución.'
    );
  }

  const fechaPago = new Date(evento.fechaPago)
    .toISOString()
    .slice(0, 10);

  const solicitud = fechaSolicitud
    .toISOString()
    .slice(0, 10);

  if (solicitud < fechaPago) {
    problema(
      400,
      'La solicitud de cancelación no puede ser anterior al pago del abono.'
    );
  }

  if (solicitud > hoyChile()) {
    problema(
      400,
      'La fecha de solicitud no puede ser futura.'
    );
  }
}

export async function calcularDevolucion(
  evento,
  fechaSolicitud,
  db = prisma
) {
  validarEventoParaDevolucion(
    evento,
    fechaSolicitud
  );

  const feriados = (process.env.FERIADOS_CL ?? '')
    .split(',')
    .map(fecha => fecha.trim())
    .filter(Boolean);

  const diasHabiles = contarDiasHabiles(
    evento.fechaPago,
    fechaSolicitud,
    feriados
  );

  const politicas = await db.politicaDevolucion.findMany();

  let tramo;

  try {
    tramo = buscarTramo(diasHabiles, politicas);

  } catch (err) {
    const error = new Error(err.message);
    error.status = 409;
    throw error;
  }

  const montoDevolucion = Math.round(
    evento.montoAbono * tramo.porcentaje / 100
  );

  return {
    diasHabiles,
    porcentaje: tramo.porcentaje / 100,
    montoDevolucion
  };
}

export async function cancelarEvento(
  id,
  fechaCancelacion,
  montoDevolucion,
  eventoOriginal
) {

  const resultado = await prisma.evento.updateMany({
    where: {
      id,
      confirmado: true,
      cancelado: false,
      fechaPago: eventoOriginal.fechaPago,
      montoAbono: eventoOriginal.montoAbono
    },

    data: {
      cancelado: true,
      confirmado: false,
      fechaCancelacion,
      montoDevolucion
    }
  });

  if (resultado.count !== 1) {
    const error = new Error(
      'El evento o el abono cambiaron. Actualiza la página antes de cancelar.'
    );

    error.status = 409;
    throw error;
  }

  return prisma.evento.findUnique({
    where: { id },

    include: {
      cliente: true,
      lugar: true
    }
  });
}
