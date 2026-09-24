import * as eventoService from '../services/evento.service.js';
import * as reclamoService from '../services/reclamo.service.js';

export const getReclamosByEvento = async (req, res, next) => {
  try {
    const eventoId = req.params.id;

    const existe = await eventoService.eventoExists(eventoId);
    if (!existe) return res.status(404).json({ error: 'Evento no encontrado' });

    const resultado = await reclamoService.getReclamosByEvento(eventoId);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export const createReclamo = async (req, res, next) => {
  try {
    const eventoId = req.params.id;

    const existe = await eventoService.eventoExists(eventoId);
    if (!existe) return res.status(404).json({ error: 'Evento no encontrado' });

    const reclamo = await reclamoService.createReclamo(eventoId, req.body);
    res.status(201).json(reclamo);
  } catch (error) {
    next(error);
  }
};