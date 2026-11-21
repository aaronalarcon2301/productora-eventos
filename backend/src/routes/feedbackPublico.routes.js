
import { Router } from 'express';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import prisma from '../config/prisma.js';

const router = Router();

const CATEGORIAS = [
  'EQUIPAMIENTO',
  'PERSONAL_ATENCION',
  'COBROS_PAGOS',
  'MONTAJE_LOGISTICA',
  'OTROS'
];

const AREAS = {
  EQUIPAMIENTO: 'AREA_TECNICA',
  PERSONAL_ATENCION: 'OPERACIONES',
  COBROS_PAGOS: 'ADMINISTRACION',
  MONTAJE_LOGISTICA: 'LOGISTICA',
  OTROS: 'ATENCION_CLIENTE'
};

const respuestaSchema = z.object({
  tipoFeedback: z.enum([
    'OPINION',
    'SUGERENCIA',
    'RECLAMO'
  ]),
  categoria: z.enum(CATEGORIAS),
  calificacion: z.number().int().min(1).max(5),
  mensaje: z.string().trim().min(5).max(2000)
}).strict();

function hashToken(token) {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

async function buscarInvitacion(token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) {
    return null;
  }

  return prisma.invitacionFeedback.findUnique({
    where: {
      tokenHash: hashToken(token)
    },
    include: {
      evento: {
        select: {
          id: true,
          nombre: true,
          fecha: true,
          cancelado: true,
          cliente: {
            select: {
              nombre: true
            }
          }
        }
      }
    }
  });
}

function invitacionValida(invitacion) {
  return Boolean(
    invitacion &&
    invitacion.estado === 'ENVIADA' &&
    invitacion.expiraAt > new Date() &&
    !invitacion.evento.cancelado
  );
}

router.get('/:token', async (req, res, next) => {
  try {
    const invitacion = await buscarInvitacion(
      req.params.token
    );

    if (!invitacionValida(invitacion)) {
      return res.status(410).json({
        message: 'El enlace no es válido, expiró o ya fue utilizado.'
      });
    }

    return res.json({
      evento: {
        nombre: invitacion.evento.nombre,
        fecha: invitacion.evento.fecha
      }
    });

  } catch (err) {
    next(err);
  }
});

router.post('/:token', async (req, res, next) => {
  try {
    const validacion = respuestaSchema.safeParse(req.body);

    if (!validacion.success) {
      return res.status(400).json({
        message: 'Revisa los datos del formulario.'
      });
    }

    const invitacion = await buscarInvitacion(
      req.params.token
    );

    if (!invitacionValida(invitacion)) {
      return res.status(410).json({
        message: 'Este enlace ya no está disponible.'
      });
    }

    const datos = validacion.data;

    const categoria = datos.tipoFeedback === 'OPINION'
      ? 'OTROS'
      : datos.categoria;

    const resultado = await prisma.$transaction(async (tx) => {
      const cambio = await tx.invitacionFeedback.updateMany({
        where: {
          id: invitacion.id,
          estado: 'ENVIADA',
          expiraAt: { gt: new Date() },
          evento: {
            cancelado: false
          }
        },
        data: {
          estado: 'RESPONDIDA',
          respondidoAt: new Date()
        }
      });

      if (cambio.count !== 1) {
        return false;
      }

      await tx.reclamo.create({
        data: {
          eventoId: invitacion.evento.id,
          autor: invitacion.evento.cliente.nombre,
          calificacion: datos.calificacion,
          mensaje: datos.mensaje,

          tipoFeedback: datos.tipoFeedback,
          categoria,
          areaResponsable: AREAS[categoria],
          estado: 'PENDIENTE'
        }
      });

      return true;
    });

    if (!resultado) {
      return res.status(409).json({
        message: 'Esta invitación ya fue utilizada.'
      });
    }

    return res.status(201).json({
      message: 'Tu respuesta se registró correctamente.'
    });

  } catch (err) {
    next(err);
  }
});

export default router;
