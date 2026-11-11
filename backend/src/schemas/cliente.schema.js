import { z } from 'zod';
import { normalizarRut, validarRut } from '../utils/rut.js';

const rutCliente = z
  .string()
  .trim()
  .transform(normalizarRut)
  .refine(validarRut, 'El RUT ingresado no es válido.');

export const createClienteSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  rut: rutCliente.nullish(),
  email: z.string().trim().toLowerCase().email('El email no es válido').max(120).nullish(),
  telefono: z.string().trim().max(30).nullish(),
});

export const updateClienteSchema = createClienteSchema.partial();

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El id debe ser numérico').transform(Number),
});
