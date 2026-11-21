import prisma from '../config/prisma.js';
import { httpError, parseId } from '../utils/http.js';

function resumen(items) {
  const totalUnidades = items.reduce(
    (suma, item) => suma + item.cantidad,
    0
  );

  const unidadesCargadas = items.reduce(
    (suma, item) => suma + item.cantidadCargada,
    0
  );

  let estado = 'PENDIENTE';

  if (totalUnidades === 0) {
    estado = 'SIN_EQUIPOS';
  } else if (unidadesCargadas === totalUnidades) {
    estado = 'COMPLETA';
  } else if (unidadesCargadas > 0) {
    estado = 'EN_PROCESO';
  }

  const porcentaje = totalUnidades > 0
    ? Math.round((unidadesCargadas / totalUnidades) * 100)
    : 0;

  return {
    totalUnidades,
    unidadesCargadas,
    porcentaje,
    estado
  };
}

export async function listarEventos(req, res, next) {
  try {
    const eventos = await prisma.evento.findMany({
      where: {
        estadoPresupuesto: 'APROBADO',
        cancelado: false
      },

      select: {
        id: true,
        nombre: true,
        fecha: true,
        finalizadoAt: true,

        cliente: {
          select: {
            nombre: true
          }
        },

        detallesCotizacion: {
          select: {
            cantidad: true,
            cantidadCargada: true
          }
        }
      },

      orderBy: {
        fecha: 'asc'
      }
    });

    const resultado = eventos.map(evento => {
      const {
        detallesCotizacion,
        ...datosEvento
      } = evento;

      return {
        ...datosEvento,
        ...resumen(detallesCotizacion)
      };
    });

    res.json(resultado);

  } catch (error) {
    next(error);
  }
}

export async function obtenerLista(req, res, next) {
  try {
    const id = parseId(
      req.params.eventoId,
      'evento'
    );

    const evento = await prisma.evento.findFirst({
      where: {
        id,
        estadoPresupuesto: 'APROBADO',
        cancelado: false
      },

      select: {
        id: true,
        nombre: true,
        fecha: true,
        finalizadoAt: true,

        cliente: {
          select: {
            nombre: true
          }
        },

        lugar: {
          select: {
            nombre: true
          }
        },

        detallesCotizacion: {
          orderBy: {
            id: 'asc'
          },

          select: {
            id: true,
            nombreEquipo: true,
            cantidad: true,
            cantidadCargada: true,
            observacionCarga: true,
            cargaActualizadaAt: true,

            cargaActualizadaPor: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });

    if (!evento) {
      throw httpError(
        404,
        'No existe un evento aprobado y vigente con ese ID.'
      );
    }

    const {
      detallesCotizacion: items,
      ...datosEvento
    } = evento;

    res.json({
      evento: datosEvento,
      items,
      ...resumen(items)
    });

  } catch (error) {
    next(error);
  }
}

export async function actualizarItem(req, res, next) {
  try {
    const id = parseId(
      req.params.itemId,
      'ítem de carga'
    );

    const {
      cantidadCargada,
      observacionCarga
    } = req.body;

    const previo = await prisma.detalleCotizacionEquipo.findUnique({
      where: { id },

      select: {
        cantidad: true,

        evento: {
          select: {
            estadoPresupuesto: true,
            cancelado: true,
            finalizadoAt: true
          }
        }
      }
    });

    if (!previo) {
      throw httpError(
        404,
        'El equipo no pertenece a una cotización existente.'
      );
    }

    if (
      previo.evento.estadoPresupuesto !== 'APROBADO' ||
      previo.evento.cancelado
    ) {
      throw httpError(
        409,
        'Solo pueden actualizarse listas de eventos aprobados y no cancelados.'
      );
    }

    if (previo.evento.finalizadoAt) {
      throw httpError(
        409,
        'No se puede modificar la carga de un evento finalizado.'
      );
    }

    if (cantidadCargada > previo.cantidad) {
      throw httpError(
        400,
        `La cantidad cargada no puede superar ${previo.cantidad}.`
      );
    }

    const resultado = await prisma.detalleCotizacionEquipo.updateMany({
      where: {
        id,

        cantidad: {
          gte: cantidadCargada
        },

        evento: {
          estadoPresupuesto: 'APROBADO',
          cancelado: false,
          finalizadoAt: null
        }
      },

      data: {
        cantidadCargada,

        ...(observacionCarga !== undefined
          ? { observacionCarga }
          : {}),

        cargaActualizadaAt: new Date(),
        cargaActualizadaPorId: req.usuario.id
      }
    });

    if (resultado.count !== 1) {
      throw httpError(
        409,
        'El evento o las cantidades cambiaron. Actualiza la lista e inténtalo de nuevo.'
      );
    }

    const item = await prisma.detalleCotizacionEquipo.findUnique({
      where: { id },

      select: {
        id: true,
        nombreEquipo: true,
        cantidad: true,
        cantidadCargada: true,
        observacionCarga: true,
        cargaActualizadaAt: true,

        cargaActualizadaPor: {
          select: {
            nombre: true
          }
        }
      }
    });

    res.json(item);

  } catch (error) {
    next(error);
  }
}