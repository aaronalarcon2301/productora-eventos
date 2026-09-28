import { z } from 'zod';

export const calcularCotizacionSchema = z.object({
  fecha: z.coerce.date({ message: 'Debe indicar una fecha y hora válidas' }),
  duracionHoras: z.number().positive('La duración debe ser mayor a 0'),
  numInvitados: z.number().int().positive('Debe haber al menos 1 invitado'),
});