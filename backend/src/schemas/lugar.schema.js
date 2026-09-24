import { z } from 'zod';

export const createLugarSchema = z.object({
  nombre: z.string().min(2).max(100),
  ubicacion: z.string().max(150).optional(),
  capacidad: z.number().int().positive().optional(),
});

export const updateLugarSchema = createLugarSchema.partial();