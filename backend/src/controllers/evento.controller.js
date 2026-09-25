import * as eventoService from '../services/evento.service.js';

export const getEventos = async (req, res, next) => {
  try {
    const eventos = await eventoService.getAllEventos(req.query);
    res.json(eventos);
  } catch (error) {
    next(error);
  }
};

export const getEventoById = async (req, res, next) => {
  try {
    const evento = await eventoService.getEventoById(req.params.id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(evento);
  } catch (error) {
    next(error);
  }
};

export const createEvento = async (req, res, next) => {
  try {
    const evento = await eventoService.createEvento(req.body);
    res.status(201).json(evento);
  } catch (error) {
    next(error);
  }
};

export const updateEvento = async (req, res, next) => {
  try {
    const evento = await eventoService.updateEvento(req.params.id, req.body);
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
    const { diasHabiles, porcentaje, montoDevolucion } = eventoService.calcularDevolucion(evento, fechaSolicitud);

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