// enrutador central - conecta todos los sub-enrutadores bajo /api

import { Router } from 'express';
import clienteRoutes from './cliente.routes.js';
import lugarRoutes from './lugar.routes.js';
import eventoRoutes from './evento.routes.js';
import evaluacionesRoutes from './evaluaciones.routes.js';
import incidentesRoutes from './incidentes.routes.js';
import trabajadoresRoutes from './trabajadores.routes.js';

const router = Router();

router.use('/clientes', clienteRoutes);
router.use('/lugares', lugarRoutes);
router.use('/eventos', eventoRoutes);
router.use('/evaluaciones', evaluacionesRoutes);
router.use('/incidentes', incidentesRoutes);
router.use('/trabajadores', trabajadoresRoutes);

export default router;