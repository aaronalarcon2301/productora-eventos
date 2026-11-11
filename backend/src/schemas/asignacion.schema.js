import { z } from "zod";
import { ROLES } from "./evaluacion.schema.js";

export const crearAsignacionSchema = z.object({
  trabajadorId: z.number().int().positive(),
  eventoId: z.number().int().positive(),
  rol: z.enum(ROLES).optional(),
});
