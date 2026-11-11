import { z } from "zod";

export const CATEGORIAS_EQUIPO = [
  "SONIDO",
  "ILUMINACION",
  "AUDIOVISUAL",
  "MOBILIARIO",
  "ESTRUCTURA",
  "OTRO",
];

const vacioANull = (valor) => {
  if (typeof valor === "string" && valor.trim() === "") return null;
  return valor;
};
const opcional = (schema) => z.preprocess(vacioANull, schema.nullable().optional());

const nombre = z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100);
const unidades = z.number().int("Debe ser un número entero").min(0, "No puede ser negativo").max(100000);

const camposEquipo = {
  nombre,
  categoria: z.enum(CATEGORIAS_EQUIPO),
  descripcion: opcional(z.string().trim().max(255)),
  cantidadTotal: unidades.min(1, "La cantidad total debe ser al menos 1"),
  cantidadMantencion: unidades,
  precioArriendoDia: opcional(z.number().int("Debe ser un número entero").min(0).max(100000000)),
};

function validarMantencion(data, ctx) {
  if (
    data.cantidadTotal !== undefined &&
    data.cantidadMantencion !== undefined &&
    data.cantidadMantencion > data.cantidadTotal
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["cantidadMantencion"],
      message: "Las unidades en mantención no pueden superar la cantidad total",
    });
  }
}

export const crearEquipoSchema = z
  .object({
    ...camposEquipo,
    cantidadMantencion: camposEquipo.cantidadMantencion.default(0),
  })
  .superRefine(validarMantencion);

export const actualizarEquipoSchema = z
  .object({ ...camposEquipo, activo: z.boolean() })
  .partial()
  .superRefine(validarMantencion)
  .refine((data) => Object.keys(data).length > 0, { message: "No se envió ningún dato para actualizar" });
