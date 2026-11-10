import { z } from "zod";

const vacioANull = (valor) => {
  if (typeof valor === "string" && valor.trim() === "") return null;
  return valor;
};

export const crearReservaEquipoSchema = z.object({
  equipoId: z.number().int().positive(),
  eventoId: z.number().int().positive(),
  cantidad: z.number().int("La cantidad debe ser un número entero").min(1, "La cantidad debe ser al menos 1"),
  // Opcional: trabajador asignado al evento que queda a cargo del equipo.
  responsableId: z.number().int().positive().nullable().optional(),
});

export const devolverReservaEquipoSchema = z.object({
  cantidadDanada: z.number().int("Debe ser un número entero").min(0, "No puede ser negativo").default(0),
  cantidadFaltante: z.number().int("Debe ser un número entero").min(0, "No puede ser negativo").default(0),
  observacion: z.preprocess(vacioANull, z.string().trim().max(255).nullable().optional()),
});
