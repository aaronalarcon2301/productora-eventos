// enrutador central - conecta todos los sub-enrutadores bajo /api

import { Router } from 'express';
import clienteRoutes from './cliente.routes.js';
import lugarRoutes from './lugar.routes.js';
import eventoRoutes from './evento.routes.js';

const router = Router();

router.use('/clientes', clienteRoutes);
router.use('/lugares', lugarRoutes);
router.use('/eventos', eventoRoutes);

export default router;