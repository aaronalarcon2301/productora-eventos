import { randomBytes } from 'node:crypto';
import prisma from '../config/prisma.js';

import { hashToken } from '../middlewares/auth.middleware.js';
import { verifyPassword } from '../utils/password.js';

const SESION_DIAS = 7;
const intentos = new Map();
const VENTANA_MS = 15 * 60 * 1000;

export async function login(req, res, next) {
  try {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();

    const password = req.body?.password;

    if (!email || typeof password !== 'string' || password.length > 512) {
      return res.status(400).json({
        error: 'Ingresa correo y contraseña válidos'
      });
    }

    const clave = `${req.ip}:${email}`;
    const ahora = Date.now();
    const registro = intentos.get(clave);

    if (registro && registro.hasta > ahora && registro.cantidad >= 10) {
      return res.status(429).json({
        error: 'Demasiados intentos. Intenta nuevamente en 15 minutos'
      });
    }

    if (intentos.size > 10000) {
      for (const [key, intento] of intentos) {
        if (intento.hasta <= ahora) intentos.delete(key);
      }
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    const valido = usuario?.activo &&
      await verifyPassword(password, usuario.passwordHash);

    if (!valido) {
      const anteriores = registro?.hasta > ahora
        ? registro.cantidad
        : 0;

      intentos.set(clave, {
        cantidad: anteriores + 1,
        hasta: ahora + VENTANA_MS
      });

      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      });
    }

    intentos.delete(clave);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      ahora + SESION_DIAS * 24 * 60 * 60 * 1000
    );

    await prisma.sesion.create({
      data: {
        tokenHash: hashToken(token),
        expiresAt,
        usuarioId: usuario.id
      }
    });

    return res.json({
      token,
      expiresAt,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  res.json({ usuario: req.usuario });
}

export async function logout(req, res, next) {
  try {
    await prisma.sesion.deleteMany({
      where: { tokenHash: req.tokenHash }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}