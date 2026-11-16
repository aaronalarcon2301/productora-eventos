import prisma from '../config/prisma.js';
import * as eventoService from '../services/evento.service.js';

export const getEventos = async (req, res, next) => {
  try {
    const eventos = await eventoService.getAllEventos(
    req.query,
    req.usuario
);
    res.json(eventos);
  } catch (error) {
    next(error);
  }
};

export const getEventoById = async (req, res, next) => {
  try {
    const evento = await eventoService.getEventoById(
    Number(req.params.id),
    req.usuario
);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(evento);
  } catch (error) {
    next(error);
  }
};

export const createEvento = async (req, res, next) => {
  try {
    const { clienteNombre, lugarNombre, clienteId, lugarId, ...datos } = req.body;
    if (
      !Number.isFinite(datos.presupuesto) ||
      datos.presupuesto <= 0
    ) {
    return res.status(400).json({
    error: 'El presupuesto debe ser mayor a cero'
    });
    }

const datosSeguro = {
  ...datos,
  confirmado: false,
  fechaPago: null,
  montoAbono: null,
  estadoPresupuesto: 'PENDIENTE',
  creadoPorId: req.usuario.id
};

    const nuevoEvento = await prisma.$transaction(async (tx) => {
      let idCliente = clienteId;
      if (!idCliente) {
        const existente = await tx.cliente.findFirst({
          where: { nombre: { equals: clienteNombre, mode: 'insensitive' } },
        });
        idCliente = existente
          ? existente.id
          : (await tx.cliente.create({ data: { nombre: clienteNombre } })).id;
      }

      let idLugar = lugarId;
      if (!idLugar) {
        const existente = await tx.lugar.findFirst({
          where: { nombre: { equals: lugarNombre, mode: 'insensitive' } },
        });
        idLugar = existente
          ? existente.id
          : (await tx.lugar.create({ data: { nombre: lugarNombre, ubicacion: 'Por definir', capacidad: 0 } })).id;
      }

      return tx.evento.create({
        data: { ...datosSeguro, clienteId: idCliente, lugarId: idLugar },
        include: { cliente: true, lugar: true },
      });
    });

    res.status(201).json(nuevoEvento);
  } catch (error) {
    next(error);
  }
};

export const updateEvento = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (req.body.confirmado === true) {
      const existente = await eventoService.getEventoById(id);

      if (!existente) {
        return res.status(404).json({
          error: 'Evento no encontrado'
        });
      }

      if (existente.estadoPresupuesto !== 'APROBADO') {
        return res.status(409).json({
          error: 'Primero debe aprobarse el presupuesto'
        });
      }
    }

    const evento = await eventoService.updateEvento(
      id,
      req.body
    );

    res.json(evento);
  } catch (error) {
    next(error);
  }
};

export const deleteEvento = async (req, res, next) => {
  try {
    await eventoService.deleteEvento(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const cancelarEvento = async (req, res, next) => {
  try {
    const evento = await eventoService.getEventoById(req.params.id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    if (evento.cancelado) {
      return res.status(400).json({ error: 'El evento ya se encuentra cancelado' });
    }
    if (!evento.confirmado) {
      return res.status(400).json({ error: 'Solo se pueden cancelar eventos previamente confirmados' });
    }
    if (!evento.fechaPago || !evento.montoAbono) {
      return res.status(400).json({ error: 'El evento no tiene registrado el pago del abono, no se puede calcular la devolución' });
    }

    const fechaSolicitud = req.body.fechaSolicitud || new Date();
    const { diasHabiles, porcentaje, montoDevolucion } = await eventoService.calcularDevolucion(evento, fechaSolicitud);

    const eventoCancelado = await eventoService.cancelarEvento(evento.id, fechaSolicitud, montoDevolucion);

    const comprobante = {
      numeroComprobante: `DEV-${evento.id}-${Date.now()}`,
      evento: eventoCancelado.nombre,
      cliente: eventoCancelado.cliente.nombre,
      lugar: eventoCancelado.lugar.nombre,
      fechaPago: evento.fechaPago,
      fechaCancelacion: fechaSolicitud,
      diasHabilesTranscurridos: diasHabiles,
      porcentajeDevolucion: porcentaje * 100,
      montoAbono: evento.montoAbono,
      montoDevolucion,
    };

    res.json({ evento: eventoCancelado, comprobante });
  } catch (error) {
    next(error);
  }
};

export const getMisSolicitudes = async (req, res, next) => {
  try {
    const solicitudes = await prisma.evento.findMany({
      where: {
        creadoPorId: req.usuario.id
      },
      include: {
        cliente: true,
        lugar: true,
        detallesCotizacion: {
          orderBy: {
            id: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(solicitudes);
  } catch (error) {
    next(error);
  }
};

export const getPresupuestosPendientes = async (req, res, next) => {
  try {
    const pendientes = await prisma.evento.findMany({
      where: {
        estadoPresupuesto: 'PENDIENTE',
        cancelado: false
      },
      include: {
        cliente: true,
        lugar: true,
        detallesCotizacion: {
          orderBy: {
            id: 'asc'
          }
        },
        creadoPor: {
          select: {
            nombre: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(pendientes);
  } catch (error) {
    next(error);
  }
};

export const resolverPresupuesto = async (req, res, next) => {
  try {
    const { decision } = req.body || {};
    const id = Number(req.params.id);

    if (!['APROBADO', 'RECHAZADO'].includes(decision)) {
      return res.status(400).json({
        error: 'Decisión inválida'
      });
    }

    const resultado = await prisma.evento.updateMany({
      where: {
        id,
        estadoPresupuesto: 'PENDIENTE',
        cancelado: false
      },
      data: {
        estadoPresupuesto: decision,
        revisadoPorId: req.usuario.id,
        revisadoAt: new Date()
      }
    });

    if (resultado.count !== 1) {
      return res.status(409).json({
        error: 'El presupuesto ya fue revisado o no está disponible'
      });
    }

    const evento = await eventoService.getEventoById(id);

    res.json(evento);
  } catch (error) {
    next(error);
  }
};