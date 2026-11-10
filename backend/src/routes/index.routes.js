// enrutador central - conecta todos los sub-enrutadores bajo /api

import { Router } from 'express';
import clienteRoutes from './cliente.routes.js';
import lugarRoutes from './lugar.routes.js';
import eventoRoutes from './evento.routes.js';
import cotizacionRoutes from './cotizacion.routes.js';
import evaluacionesRoutes from './evaluaciones.routes.js';
import incidentesRoutes from './incidentes.routes.js';
import trabajadoresRoutes from './trabajadores.routes.js';
import asignacionesRoutes from './asignaciones.routes.js';
import equiposRoutes from './equipos.routes.js';
import reservasEquipoRoutes from './reservasEquipo.routes.js';

const router = Router();

router.use('/clientes', clienteRoutes);
router.use('/lugares', lugarRoutes);
router.use('/eventos', eventoRoutes);
router.use('/cotizaciones', cotizacionRoutes);
router.use('/evaluaciones', evaluacionesRoutes);
router.use('/incidentes', incidentesRoutes);
router.use('/trabajadores', trabajadoresRoutes);
router.use('/asignaciones', asignacionesRoutes);
router.use('/equipos', equiposRoutes);
router.use('/reservas-equipo', reservasEquipoRoutes);

export default router;