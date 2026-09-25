import { z } from 'zod';

export const createEventoSchema = z.object({
  nombre: z.string().min(2, 'El nombre del evento es obligatorio').max(100),
  fecha: z.coerce.date({ message: 'Debe indicar una fecha válida' }),
  numInvitados: z.number().int().positive('Debe haber al menos 1 invitado'),
  presupuesto: z.number().positive().optional(),
  confirmado: z.boolean().default(false),
  fechaPago: z.coerce.date().optional(),
  montoAbono: z.number().positive().optional(),
  clienteId: z.number().int().positive('Debe indicar un cliente válido'),
  lugarId: z.number().int().positive('Debe indicar un lugar válido'),
});

export const updateEventoSchema = createEventoSchema.partial();

// Si no se envía fechaSolicitud, el backend usa la fecha/hora actual.
export const cancelarEventoSchema = z.object({
  fechaSolicitud: z.coerce.date().optional(),
});