import { z } from "zod";

export const crearIncidenteSchema = z
  .object({
    trabajadorId: z.number().int().positive(),
    eventoId: z.number().int().positive().optional(),
    tipo: z.enum(["INASISTENCIA", "FALTA_GRAVE"]),
    motivo: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    // Regla: la falta grave exige motivo antes de bloquear al trabajador.
    // La inasistencia no lo exige (queda solo registrada).
    if (data.tipo === "FALTA_GRAVE" && !data.motivo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivo"],
        message: "Describe el motivo de la falta grave antes de bloquear al trabajador.",
      });
    }
  });