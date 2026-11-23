
import { z } from "zod";
import { ROLES } from "./evaluacion.schema.js";

export const crearAsignacionSchema = z.object({
  trabajadorId: z.number().int().positive(),

  eventoId: z.number().int().positive(),

  rol: z.enum(ROLES).optional(),

  turno: z.enum(['DIURNO', 'NOCTURNO']),

  horaLlegada: z.string().regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    'La hora de llegada debe tener formato HH:mm.'
  )
}).strict();
