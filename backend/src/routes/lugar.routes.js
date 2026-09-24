import { Router } from 'express';
import {
  getLugares,
  getLugarById,
  createLugar,
  updateLugar,
  deleteLugar,
} from '../controllers/lugar.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createLugarSchema, updateLugarSchema } from '../schemas/lugar.schema.js';
import { idParamSchema } from '../schemas/cliente.schema.js'; 

const router = Router();

router.get('/', getLugares);
router.get('/:id', validate(idParamSchema, 'params'), getLugarById);
router.post('/', validate(createLugarSchema, 'body'), createLugar);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateLugarSchema, 'body'), updateLugar);
router.delete('/:id', validate(idParamSchema, 'params'), deleteLugar);

export default router;