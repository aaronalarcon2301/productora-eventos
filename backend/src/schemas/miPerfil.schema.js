import { z } from "zod";
import { camposTrabajador } from "./trabajador.schema.js";

export const actualizarMiPerfilSchema = z
  .object({
    telefono: camposTrabajador.telefono,
    comuna: camposTrabajador.comuna,
    disponibilidadDias: camposTrabajador.disponibilidadDias,
    disponibilidadTurno: camposTrabajador.disponibilidadTurno,
  })
  .partial()
  .superRefine((datos, ctx) => {
    if (Object.keys(datos).length === 0) {
      ctx.addIssue({ code: "custom", message: "Debes enviar al menos un campo para actualizar." });
    }
  });

export const cambiarPasswordSchema = z
  .object({
    passwordActual: z.string({ error: "Ingresa tu contraseña actual." }).min(1, "Ingresa tu contraseña actual."),
    passwordNueva: z
      .string({ error: "Ingresa la contraseña nueva." })
      .min(10, "La contraseña nueva debe tener al menos 10 caracteres.")
      .max(100, "La contraseña nueva no puede superar los 100 caracteres."),
  })
  .superRefine((datos, ctx) => {
    if (datos.passwordNueva === datos.passwordActual) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordNueva"],
        message: "La contraseña nueva debe ser distinta de la actual.",
      });
    }
  });

const vacioANull = (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor);

export const responderAsignacionSchema = z
  .object({
    respuesta: z.enum(["CONFIRMADA", "RECHAZADA"], {
      error: "La respuesta debe ser CONFIRMADA o RECHAZADA.",
    }),
    comentario: z.preprocess(
      vacioANull,
      z.string().trim().max(200, "El comentario no puede superar los 200 caracteres.").nullable().optional()
    ),
  })
  .superRefine((datos, ctx) => {
    if (datos.respuesta === "RECHAZADA" && !datos.comentario) {
      ctx.addIssue({
        code: "custom",
        path: ["comentario"],
        message: "Indica brevemente el motivo por el que no puedes asistir.",
      });
    }
  });
