
import { z } from 'zod';
import prisma from '../config/prisma.js';

const AREAS = {
  EQUIPAMIENTO: 'AREA_TECNICA',
  PERSONAL_ATENCION: 'OPERACIONES',
  COBROS_PAGOS: 'ADMINISTRACION',
  MONTAJE_LOGISTICA: 'LOGISTICA',
  OTROS: 'ATENCION_CLIENTE'
};

const actualizarSchema = z.object({
  categoria: z.enum([
    'EQUIPAMIENTO',
    'PERSONAL_ATENCION',
    'COBROS_PAGOS',
    'MONTAJE_LOGISTICA',
    'OTROS'
  ]).optional(),

  responsableId: z.number().int().positive().nullable().optional(),

  estado: z.enum([
    'PENDIENTE',
    'EN_REVISION',
    'RESUELTO'
  ]).optional(),

  respuesta: z.string().trim().max(2000).nullable().optional()
}).strict();

const incluir = {
  evento: {
    select: {
      id: true,
      nombre: true
    }
  },
  responsable: {
    select: {
      id: true,
      nombre: true,
      rol: true
    }
  }
};

const fallo = (res, codigo, mensaje) =>
  res.status(codigo).json({ message: mensaje });

export async function listar(req, res, next) {
  try {
    const gerente = req.usuario.rol === 'GERENTE';

    const reclamos = await prisma.reclamo.findMany({
      where: gerente
        ? {}
        : { responsableId: req.usuario.id },
      include: incluir,
      orderBy: { id: 'desc' }
    });

    res.json(reclamos);
  } catch (err) {
    next(err);
  }
}

export async function listarResponsables(req, res, next) {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: {
        activo: true,
        rol: { in: ['GERENTE', 'TRABAJADOR'] }
      },
      select: {
        id: true,
        nombre: true,
        rol: true
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

export async function actualizar(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return fallo(res, 400, 'ID de reclamo no válido.');
    }

    const validacion = actualizarSchema.safeParse(req.body);

    if (
      !validacion.success ||
      Object.keys(validacion.data || {}).length === 0
    ) {
      return fallo(res, 400, 'Datos de gestión no válidos.');
    }

    const datos = { ...validacion.data };
    const gerente = req.usuario.rol === 'GERENTE';

    const actual = await prisma.reclamo.findUnique({
      where: { id }
    });

    if (!actual) {
      return fallo(res, 404, 'Reclamo no encontrado.');
    }

    if (!gerente) {
      if (actual.responsableId !== req.usuario.id) {
        return fallo(res, 403, 'No tienes este reclamo asignado.');
      }

      if (
        datos.categoria !== undefined ||
        datos.responsableId !== undefined
      ) {
        return fallo(res, 403, 'No puedes reasignar reclamos.');
      }
    }

    if (datos.categoria !== undefined) {
      datos.areaResponsable = AREAS[datos.categoria];

      if (
        datos.categoria !== actual.categoria &&
        datos.responsableId === undefined
      ) {
        datos.responsableId = null;
      }
    }

    if (datos.responsableId != null) {
      const responsable = await prisma.usuario.findFirst({
        where: {
          id: datos.responsableId,
          activo: true,
          rol: { in: ['GERENTE', 'TRABAJADOR'] }
        },
        select: { id: true }
      });

      if (!responsable) {
        return fallo(res, 400, 'El responsable no está disponible.');
      }
    }

    const nuevoEstado = datos.estado ?? actual.estado;

    const respuesta = datos.respuesta === undefined
      ? actual.respuesta
      : datos.respuesta;

    if (
      nuevoEstado === 'RESUELTO' &&
      !respuesta?.trim()
    ) {
      return fallo(
        res,
        400,
        'Registra una solución antes de resolver el reclamo.'
      );
    }

    if (datos.estado === 'RESUELTO') {
      if (actual.estado !== 'RESUELTO') {
        datos.fechaResolucion = new Date();
      }
    } else if (datos.estado !== undefined) {
      datos.fechaResolucion = null;
    }

    const actualizado = await prisma.reclamo.update({
      where: { id },
      data: datos,
      include: incluir
    });

    res.json(actualizado);

  } catch (err) {
    next(err);
  }
}
