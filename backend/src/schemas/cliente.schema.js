import { z } from 'zod';

export const createClienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('El email no es válido').max(120).optional(),
  telefono: z.string().max(30).optional(),
});

export const updateClienteSchema = createClienteSchema.partial();

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El id debe ser numérico').transform(Number),
});