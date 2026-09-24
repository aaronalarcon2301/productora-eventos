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