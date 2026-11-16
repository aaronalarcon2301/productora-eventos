import prisma from '../config/prisma.js';
import { httpError } from '../utils/http.js';

import {
  unidadesReservadasPorEquipo,
  unidadesOperativas
} from './equipo.service.js';

export async function crearSolicitudCotizacion(datos, usuarioId) {
  const {
    nombre,
    fecha,
    numInvitados,
    clienteId,
    lugarId,
    costoServicios,
    equipos: solicitados
  } = datos;

  return prisma.$transaction(async (tx) => {
    const [cliente, lugar, inventario] = await Promise.all([
      tx.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true }
      }),
      tx.lugar.findUnique({
        where: { id: lugarId },
        select: { id: true }
      }),
      tx.equipo.findMany({
        where: {
          id: {
            in: solicitados.map(e => e.equipoId)
          }
        }
      })
    ]);

    if (!cliente) {
      throw httpError(404, 'El cliente seleccionado no existe');
    }

    if (!lugar) {
      throw httpError(404, 'El lugar seleccionado no existe');
    }

    const equiposPorId = new Map(
      inventario.map(e => [e.id, e])
    );

    const reservados = await unidadesReservadasPorEquipo(
      fecha,
      { db: tx }
    );

    const detalles = [];
    let totalEquipos = 0;

    for (const item of solicitados) {
      const equipo = equiposPorId.get(item.equipoId);

      if (!equipo || !equipo.activo) {
        throw httpError(
          400,
          `El equipo ${item.equipoId} no está disponible`
        );
      }

      if (equipo.precioArriendoDia == null) {
        throw httpError(
          400,
          `"${equipo.nombre}" no tiene precio de arriendo configurado`
        );
      }

      const operativas = unidadesOperativas(equipo);
      const ocupadas = reservados.get(equipo.id) ?? 0;
      const disponibles = Math.max(0, operativas - ocupadas);

      if (item.cantidad > disponibles) {
        throw httpError(
          409,
          `Solo hay ${disponibles} unidades disponibles de "${equipo.nombre}" en la fecha seleccionada`
        );
      }

      const subtotal =
        equipo.precioArriendoDia *
        item.cantidad *
        item.diasArriendo;

      totalEquipos += subtotal;

      detalles.push({
        equipoId: equipo.id,
        nombreEquipo: equipo.nombre,
        cantidad: item.cantidad,
        diasArriendo: item.diasArriendo,
        precioUnitarioDia: equipo.precioArriendoDia,
        subtotal
      });
    }

    const presupuestoTotal = totalEquipos + costoServicios;

    if (
      !Number.isSafeInteger(presupuestoTotal) ||
      presupuestoTotal <= 0
    ) {
      throw httpError(400, 'El presupuesto total no es válido');
    }

    return tx.evento.create({
      data: {
        nombre,
        fecha,
        numInvitados,
        clienteId,
        lugarId,
        costoServicios,
        presupuesto: presupuestoTotal,

        confirmado: false,
        estadoPresupuesto: 'PENDIENTE',
        creadoPorId: usuarioId,

        detallesCotizacion: {
          create: detalles
        }
      },
      include: {
        cliente: true,
        lugar: true,
        detallesCotizacion: true
      }
    });
  });
}