import { z } from "zod";

export const crearIncidenteSchema = z
  .object({
    trabajadorId: z.number().int().positive(),
    eventoId: z.number().int().positive().optional(),
    tipo: z.enum(["INASISTENCIA", "FALTA_GRAVE"]),
    motivo: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "FALTA_GRAVE" && !data.motivo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivo"],
        message: "Describe el motivo de la falta grave antes de bloquear al trabajador.",
      });
    }
  });