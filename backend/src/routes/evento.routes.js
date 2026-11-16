import { Router } from 'express';

import {
  getEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
  cancelarEvento,
  getMisSolicitudes,
  getPresupuestosPendientes,
  resolverPresupuesto
} from '../controllers/evento.controller.js';

import {
  getReclamosByEvento,
  createReclamo
} from '../controllers/reclamo.controller.js';

import { requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

import {
  createEventoSchema,
  updateEventoSchema,
  cancelarEventoSchema
} from '../schemas/evento.schema.js';

import { createReclamoSchema } from '../schemas/reclamo.schema.js';
import { idParamSchema } from '../schemas/cliente.schema.js';

const router = Router();
const gerente = requireRole('GERENTE');

router.get('/', getEventos);
router.get('/mis-solicitudes', getMisSolicitudes);

router.get('/pendientes', gerente, getPresupuestosPendientes);

router.patch(
  '/:id/presupuesto',
  gerente,
  validate(idParamSchema, 'params'),
  resolverPresupuesto
);

router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  getEventoById
);

router.post(
  '/',
  validate(createEventoSchema, 'body'),
  createEvento
);

router.put(
  '/:id',
  gerente,
  validate(idParamSchema, 'params'),
  validate(updateEventoSchema, 'body'),
  updateEvento
);

router.delete(
  '/:id',
  gerente,
  validate(idParamSchema, 'params'),
  deleteEvento
);

router.post(
  '/:id/cancelar',
  gerente,
  validate(idParamSchema, 'params'),
  validate(cancelarEventoSchema, 'body'),
  cancelarEvento
);

router.get(
  '/:id/reclamos',
  gerente,
  validate(idParamSchema, 'params'),
  getReclamosByEvento
);

router.post(
  '/:id/reclamos',
  gerente,
  validate(idParamSchema, 'params'),
  validate(createReclamoSchema, 'body'),
  createReclamo
);

export default router;