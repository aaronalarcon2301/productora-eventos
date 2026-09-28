import * as cotizacionService from '../services/cotizacion.service.js';

export const calcularCotizacion = async (req, res, next) => {
  try {
    const resultado = await cotizacionService.calcularCotizacion(req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};