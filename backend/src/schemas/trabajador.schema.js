import { z } from "zod";
import { ROLES } from "./evaluacion.schema.js";
import { normalizarRut, validarRut } from "../utils/rut.js";

export const TALLAS = ["XS", "S", "M", "L", "XL", "XXL"];
export const DIAS_SEMANA = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
export const TURNOS = ["DIURNO", "NOCTURNO", "AMBOS"];
export const TIPOS_CUENTA = ["CORRIENTE", "VISTA", "CUENTA_RUT", "AHORRO"];
export const BANCOS = [
  "Banco de Chile",
  "BancoEstado",
  "Banco Santander",
  "BCI",
  "Scotiabank",
  "Banco Itaú",
  "Banco Falabella",
  "Banco Security",
  "Banco Ripley",
  "Banco BICE",
  "Banco Consorcio",
  "Banco Internacional",
  "Coopeuch",
  "Mercado Pago",
  "Tenpo",
  "Otro",
];

const vacioANull = (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor);
const opcional = (schema) => z.preprocess(vacioANull, schema.nullable().optional());

const campos = {
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  rut: z
    .string()
    .trim()
    .min(1, "Ingresa el RUT.")
    .transform(normalizarRut)
    .refine(validarRut, "El RUT ingresado no es válido."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "El correo no puede superar los 120 caracteres.")
    .pipe(z.email("Ingresa un correo electrónico válido.")),
  telefono: z
    .string()
    .trim()
    .transform((valor) => valor.replace(/[\s\-().]/g, ""))
    .refine((valor) => /^\+?\d{8,12}$/.test(valor), "Ingresa un teléfono válido (ej: +56 9 1234 5678)."),
  comuna: opcional(z.string().trim().max(80, "La comuna no puede superar los 80 caracteres.")),

  rolPrincipal: z.enum(ROLES, { error: "Selecciona un cargo principal válido." }),
  aniosExperiencia: opcional(
    z
      .number({ error: "Los años de experiencia deben ser un número." })
      .int("Los años de experiencia deben ser un número entero.")
      .min(0, "Los años de experiencia no pueden ser negativos.")
      .max(60, "Revisa los años de experiencia ingresados.")
  ),
  disponibilidadDias: z
    .array(z.enum(DIAS_SEMANA, { error: "Día de la semana no válido." }))
    .transform((dias) => [...new Set(dias)])
    .optional(),
  disponibilidadTurno: opcional(z.enum(TURNOS, { error: "Selecciona un turno válido." })),

  tallaUniforme: opcional(z.enum(TALLAS, { error: "Selecciona una talla de uniforme válida." })),
  banco: opcional(z.enum(BANCOS, { error: "Selecciona un banco de la lista." })),
  tipoCuenta: opcional(z.enum(TIPOS_CUENTA, { error: "Selecciona un tipo de cuenta válido." })),
  numeroCuenta: opcional(
    z
      .string()
      .trim()
      .transform((valor) => valor.replace(/[\s-]/g, ""))
      .refine((valor) => /^\d{6,20}$/.test(valor), "El número de cuenta debe tener entre 6 y 20 dígitos.")
  ),
};

const DATOS_BANCARIOS = [
  ["banco", "el banco"],
  ["tipoCuenta", "el tipo de cuenta"],
  ["numeroCuenta", "el número de cuenta"],
];

function validarDatosBancarios(datos, ctx) {
  const presentes = DATOS_BANCARIOS.filter(([campo]) => datos[campo] !== undefined && datos[campo] !== null);
  if (presentes.length === 0 || presentes.length === DATOS_BANCARIOS.length) return;

  for (const [campo, etiqueta] of DATOS_BANCARIOS) {
    if (datos[campo] === undefined || datos[campo] === null) {
      ctx.addIssue({
        code: "custom",
        path: [campo],
        message: `Completa los datos bancarios: falta ${etiqueta}.`,
      });
    }
  }
}

export const crearTrabajadorSchema = z.object(campos).superRefine(validarDatosBancarios);

export const actualizarTrabajadorSchema = z
  .object(campos)
  .partial()
  .extend({ activo: z.boolean().optional() })
  .superRefine((datos, ctx) => {
    if (Object.keys(datos).length === 0) {
      ctx.addIssue({ code: "custom", message: "Debes enviar al menos un campo para actualizar." });
      return;
    }
    validarDatosBancarios(datos, ctx);
  });
