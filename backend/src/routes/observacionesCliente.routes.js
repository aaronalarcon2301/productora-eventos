
import { Router } from 'express';
import prisma from '../config/prisma.js';

import {
  requireAuth,
  requireRole
} from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

function validarId(req, res) {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({
      message: 'ID de cliente no válido.'
    });
    return null;
  }

  return id;
}

router.get(
  '/:id',
  requireRole('GERENTE', 'TRABAJADOR'),
  async (req, res, next) => {
    try {
      const id = validarId(req, res);
      if (id === null) return;

      const cliente = await prisma.cliente.findUnique({
        where: { id },
        select: {
          id: true,
          nombre: true,
          observaciones: true
        }
      });

      if (!cliente) {
        return res.status(404).json({
          message: 'Cliente no encontrado.'
        });
      }

      res.json({
        ...cliente,
        puedeEditar: req.usuario.rol === 'GERENTE'
      });

    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  requireRole('GERENTE'),
  async (req, res, next) => {
    try {
      const id = validarId(req, res);
      if (id === null) return;

      const observaciones = req.body?.observaciones;

      if (
        observaciones !== null &&
        typeof observaciones !== 'string'
      ) {
        return res.status(400).json({
          message: 'Las observaciones deben ser texto.'
        });
      }

      const texto = observaciones?.trim() || null;

      if (texto && texto.length > 2000) {
        return res.status(400).json({
          message: 'Las observaciones no pueden superar 2000 caracteres.'
        });
      }

      const cliente = await prisma.cliente.update({
        where: { id },
        data: {
          observaciones: texto
        },
        select: {
          id: true,
          nombre: true,
          observaciones: true
        }
      });

      res.json({
        ...cliente,
        puedeEditar: true
      });

    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          message: 'Cliente no encontrado.'
        });
      }

      next(error);
    }
  }
);

export default router;