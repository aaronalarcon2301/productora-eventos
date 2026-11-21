
import { Router } from 'express';

import {
  requireAuth,
  requireRole
} from '../middlewares/auth.middleware.js';

import {
  listar,
  listarResponsables,
  actualizar
} from '../controllers/reclamoGestion.controller.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requireRole('GERENTE', 'TRABAJADOR'),
  listar
);

router.get(
  '/responsables',
  requireRole('GERENTE'),
  listarResponsables
);

router.patch(
  '/:id',
  requireRole('GERENTE', 'TRABAJADOR'),
  actualizar
);

export default router;
