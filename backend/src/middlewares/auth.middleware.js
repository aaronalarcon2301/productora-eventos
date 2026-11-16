import { createHash } from 'node:crypto';
import prisma from '../config/prisma.js';

export const hashToken = (token) =>
  createHash('sha256').update(token).digest('hex');

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const match = /^Bearer ([a-f0-9]{64})$/i.exec(authorization);

    if (!match) {
      return res.status(401).json({
        error: 'Debes iniciar sesión'
      });
    }

    const tokenHash = hashToken(match[1]);

    const sesion = await prisma.sesion.findUnique({
      where: { tokenHash },
      include: { usuario: true }
    });

    if (
      !sesion ||
      sesion.expiresAt <= new Date() ||
      !sesion.usuario.activo
    ) {
      return res.status(401).json({
        error: 'La sesión expiró o no es válida'
      });
    }

    req.usuario = {
      id: sesion.usuario.id,
      nombre: sesion.usuario.nombre,
      email: sesion.usuario.email,
      rol: sesion.usuario.rol
    };

    req.tokenHash = tokenHash;

    next();
  } catch (error) {
    next(error);
  }
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};