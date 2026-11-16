import { z } from 'zod';

export const calcularCotizacionSchema = z.object({
  fecha: z.coerce.date({ message: 'Debe indicar una fecha y hora válidas' }),
  duracionHoras: z.number().positive('La duración debe ser mayor a 0'),
  numInvitados: z.number().int().positive('Debe haber al menos 1 invitado'),
});

const equipoCotizadoSchema = z.object({
  equipoId: z.number().int().positive(),
  cantidad: z.number().int().min(1).max(1000),
  diasArriendo: z.number().int().min(1).max(30)
});

export const solicitarCotizacionSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  fecha: z.coerce.date(),
  numInvitados: z.number().int().positive(),
  clienteId: z.number().int().positive(),
  lugarId: z.number().int().positive(),

  costoServicios: z.number().int().min(0).max(500000000),

  equipos: z.array(equipoCotizadoSchema).max(50)
}).superRefine((datos, ctx) => {
  const ids = datos.equipos.map(e => e.equipoId);

  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['equipos'],
      message: 'No puedes agregar el mismo equipo dos veces'
    });
  }

  if (!ids.length && datos.costoServicios === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['equipos'],
      message: 'Agrega al menos un equipo o un servicio'
    });
  }
});