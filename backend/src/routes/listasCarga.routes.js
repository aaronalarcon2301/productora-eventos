import { Router } from 'express';

import {
  requireAuth,
  requireRole
} from '../middlewares/auth.middleware.js';

import { validate } from '../middlewares/validate.middleware.js';

import {
  actualizarCargaSchema
} from '../schemas/listaCarga.schema.js';

import * as controller from '../controllers/listasCarga.controller.js';

const router = Router();

router.use(requireAuth);

router.use(requireRole('TRABAJADOR', 'GERENTE'));

router.get(
  '/eventos',
  controller.listarEventos
);

router.get(
  '/eventos/:eventoId',
  controller.obtenerLista
);

router.patch(
  '/items/:itemId',
  requireRole('TRABAJADOR'),
  validate(actualizarCargaSchema, 'body'),
  controller.actualizarItem
);

export default router;