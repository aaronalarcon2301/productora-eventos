import { Router } from 'express';
import prisma from '../config/prisma.js';

import authRoutes from './auth.routes.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

import politicaRoutes from './politica.routes.js';
import clienteRoutes from './cliente.routes.js';
import lugarRoutes from './lugar.routes.js';
import eventoRoutes from './evento.routes.js';
import cotizacionRoutes from './cotizacion.routes.js';
import evaluacionesRoutes from './evaluaciones.routes.js';
import incidentesRoutes from './incidentes.routes.js';
import trabajadoresRoutes from './trabajadores.routes.js';
import asignacionesRoutes from './asignaciones.routes.js';
import equiposRoutes from './equipos.routes.js';
import eventoFinalizacionRoutes from './eventoFinalizacion.routes.js';
import reservasEquipoRoutes from './reservasEquipo.routes.js';
import { createCliente } from '../controllers/cliente.controller.js';
import { createClienteSchema } from '../schemas/cliente.schema.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use('/auth', authRoutes);

router.use(requireAuth);

router.get('/catalogos', async (req, res, next) => {
  try {
    const [clientes, lugares] = await Promise.all([
      prisma.cliente.findMany({
        select: {
        id: true,
        nombre: true,
        rut: true,
        email: true,
        telefono: true
    },
        orderBy: { nombre: 'asc' }
    })
    ]);

    res.json({ clientes, lugares });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/catalogos/clientes',
  validate(createClienteSchema, 'body'),
  createCliente
);

const gerente = requireRole('GERENTE');

router.use('/eventos', eventoRoutes);
router.use('/cotizaciones', cotizacionRoutes);

router.use('/clientes', gerente, clienteRoutes);
router.use('/lugares', gerente, lugarRoutes);
router.use('/eventos', gerente, eventoFinalizacionRoutes);
router.use('/evaluaciones', gerente, evaluacionesRoutes);
router.use('/incidentes', gerente, incidentesRoutes);
router.use('/trabajadores', gerente, trabajadoresRoutes);
router.use('/asignaciones', gerente, asignacionesRoutes);
router.use('/equipos', equiposRoutes);
router.use('/reservas-equipo', gerente, reservasEquipoRoutes);
router.use('/politicas', gerente, politicaRoutes);

export default router;