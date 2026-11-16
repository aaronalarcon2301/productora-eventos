import { Router } from 'express';

import { validate } from '../middlewares/validate.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';

import {
  crearEquipoSchema,
  actualizarEquipoSchema
} from '../schemas/equipo.schema.js';

import * as equiposController from '../controllers/equipos.controller.js';

const router = Router();

const soloGerente = requireRole('GERENTE');

router.get('/', equiposController.listar);

router.get('/:equipoId', soloGerente, equiposController.obtener);

router.post(
  '/',
  soloGerente,
  validate(crearEquipoSchema),
  equiposController.crear
);

router.put(
  '/:equipoId',
  soloGerente,
  validate(actualizarEquipoSchema),
  equiposController.actualizar
);

router.delete(
  '/:equipoId',
  soloGerente,
  equiposController.eliminar
);

export default router;