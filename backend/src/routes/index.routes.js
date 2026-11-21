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
import listasCargaRoutes from './listasCarga.routes.js';
import reclamoGestionRoutes from './reclamoGestion.routes.js';

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
      }),

      prisma.lugar.findMany({
        select: {
          id: true,
          nombre: true,
          ubicacion: true,
          capacidad: true
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

router.post('/catalogos/lugares', async (req, res, next) => {
  try {
    const nombre = typeof req.body?.nombre === 'string'
      ? req.body.nombre.trim()
      : '';

    const ubicacion = typeof req.body?.ubicacion === 'string'
      ? req.body.ubicacion.trim()
      : '';

    const capacidad = Number(req.body?.capacidad);

    if (nombre.length < 2 || nombre.length > 100) {
      return res.status(400).json({
        message: 'El nombre debe tener entre 2 y 100 caracteres.'
      });
    }

    if (ubicacion.length < 2 || ubicacion.length > 100) {
      return res.status(400).json({
        message: 'La ubicación debe tener entre 2 y 100 caracteres.'
      });
    }

    if (!Number.isSafeInteger(capacidad) || capacidad < 1) {
      return res.status(400).json({
        message: 'La capacidad debe ser un número entero mayor a cero.'
      });
    }

    const lugar = await prisma.lugar.create({
      data: {
        nombre,
        ubicacion,
        capacidad
      },
      select: {
        id: true,
        nombre: true,
        ubicacion: true,
        capacidad: true
      }
    });

    res.status(201).json(lugar);

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Ya existe un lugar con esos datos.'
      });
    }

    next(error);
  }
});

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
router.use('/listas-carga', listasCargaRoutes);
router.use('/reclamos-gestion', reclamoGestionRoutes);

export default router;