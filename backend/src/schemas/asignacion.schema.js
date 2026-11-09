import { z } from "zod";
import { ROLES } from "./evaluacion.schema.js";

export const crearAsignacionSchema = z.object({
  trabajadorId: z.number().int().positive(),
  eventoId: z.number().int().positive(),
  // Si no se envía, se usa el rol principal del trabajador.
  rol: z.enum(ROLES).optional(),
});
