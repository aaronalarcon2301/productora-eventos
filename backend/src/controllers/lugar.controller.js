import * as lugarService from '../services/lugar.service.js';

export const getLugares = async (req, res, next) => {
  try {
    const lugares = await lugarService.getAllLugares();
    res.json(lugares);
  } catch (error) {
    next(error);
  }
};

export const getLugarById = async (req, res, next) => {
  try {
    const lugar = await lugarService.getLugarById(req.params.id);
    if (!lugar) return res.status(404).json({ error: 'Lugar no encontrado' });
    res.json(lugar);
  } catch (error) {
    next(error);
  }
};

export const createLugar = async (req, res, next) => {
  try {
    const lugar = await lugarService.createLugar(req.body);
    res.status(201).json(lugar);
  } catch (error) {
    next(error);
  }
};

export const updateLugar = async (req, res, next) => {
  try {
    const lugar = await lugarService.updateLugar(req.params.id, req.body);
    res.json(lugar);
  } catch (error) {
    next(error);
  }
};

export const deleteLugar = async (req, res, next) => {
  try {
    await lugarService.deleteLugar(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};