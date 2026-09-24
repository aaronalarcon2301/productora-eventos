import { Router } from 'express';
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
} from '../controllers/cliente.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createClienteSchema, updateClienteSchema, idParamSchema } from '../schemas/cliente.schema.js';

const router = Router();

router.get('/', getClientes);
router.get('/:id', validate(idParamSchema, 'params'), getClienteById);
router.post('/', validate(createClienteSchema, 'body'), createCliente);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateClienteSchema, 'body'), updateCliente);
router.delete('/:id', validate(idParamSchema, 'params'), deleteCliente);

export default router;