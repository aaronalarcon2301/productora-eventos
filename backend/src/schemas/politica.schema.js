
import { z } from 'zod';

export const actualizarPoliticaSchema = z.object({
  porcentaje: z.number().int().min(0).max(100),

  diasDesde: z.number().int().min(0),

  diasHasta: z.number().int().min(0).nullable()
}).strict().refine(
  politica =>
    politica.diasHasta === null ||
    politica.diasHasta >= politica.diasDesde,
  {
    message: 'El límite superior no puede ser menor al inferior.',
    path: ['diasHasta']
  }
);
