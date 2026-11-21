import { z } from 'zod';

export const actualizarCargaSchema = z.object({
  cantidadCargada: z.number().int().min(0),

  observacionCarga: z
    .string()
    .trim()
    .max(255)
    .nullable()
    .optional()
}).strict();