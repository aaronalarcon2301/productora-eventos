import { Router } from 'express';
import {
  getEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
} from '../controllers/evento.controller.js';
import {
  getReclamosByEvento,
  createReclamo,
} from '../controllers/reclamo.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createEventoSchema, updateEventoSchema } from '../schemas/evento.schema.js';
import { createReclamoSchema } from '../schemas/reclamo.schema.js';
import { idParamSchema } from '../schemas/cliente.schema.js';

const router = Router();

router.get('/', getEventos);
router.get('/:id', validate(idParamSchema, 'params'), getEventoById);
router.post('/', validate(createEventoSchema, 'body'), createEvento);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateEventoSchema, 'body'), updateEvento);
router.delete('/:id', validate(idParamSchema, 'params'), deleteEvento);

// Endpoints anidados - reclamos de un evento específico
router.get('/:id/reclamos', validate(idParamSchema, 'params'), getReclamosByEvento);
router.post('/:id/reclamos', validate(idParamSchema, 'params'), validate(createReclamoSchema, 'body'), createReclamo);

export default router;