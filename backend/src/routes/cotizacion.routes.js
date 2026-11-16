import { Router } from 'express';

import {
  calcularCotizacion,
  solicitarCotizacion
} from '../controllers/cotizacion.controller.js';

import { validate } from '../middlewares/validate.middleware.js';

import {
  calcularCotizacionSchema,
  solicitarCotizacionSchema
} from '../schemas/cotizacion.schema.js';

const router = Router();

router.post(
  '/solicitar',
  validate(solicitarCotizacionSchema, 'body'),
  solicitarCotizacion
);

router.post(
  '/',
  validate(calcularCotizacionSchema, 'body'),
  calcularCotizacion
);

export default router;