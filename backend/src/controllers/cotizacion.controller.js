import * as cotizacionService from '../services/cotizacion.service.js';
import { crearSolicitudCotizacion } from '../services/cotizacionEvento.service.js';

export const calcularCotizacion = async (req, res, next) => {
  try {
    const resultado = await cotizacionService.calcularCotizacion(req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export const solicitarCotizacion = async (req, res, next) => {
  try {
    const evento = await crearSolicitudCotizacion(
      req.body,
      req.usuario.id
    );

    res.status(201).json(evento);
  } catch (error) {
    next(error);
  }
};