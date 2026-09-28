import { z } from "zod";

export const ROLES_TECNICOS = ["TECNICO_SONIDO", "TECNICO_ILUMINACION", "MONTAJISTA"];

const ROLES = [
  "TECNICO_SONIDO",
  "TECNICO_ILUMINACION",
  "MONTAJISTA",
  "ANIMADOR",
  "GARZON",
  "ANFITRION",
  "ASEO_LOGISTICA",
  "SEGURIDAD",
];

export function esRolTecnico(rol) {
  return ROLES_TECNICOS.includes(rol);
}

const nota = z.number().int().min(1).max(5);

export const crearEvaluacionSchema = z
  .object({
    trabajadorId: z.number().int().positive(),
    eventoId: z.number().int().positive(),
    rolEvento: z.enum(ROLES),

    puntualidad: nota,
    comentarioPuntualidad: z.string().trim().min(1).optional(),
    trato: nota,
    comentarioTrato: z.string().trim().min(1).optional(),
    eficiencia: nota,
    comentarioEficiencia: z.string().trim().min(1).optional(),

    manejoEquipos: nota.optional(),
    comentarioManejoEquipos: z.string().trim().min(1).optional(),

    adminId: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    
    const criterios = [
      ["puntualidad", "comentarioPuntualidad"],
      ["trato", "comentarioTrato"],
      ["eficiencia", "comentarioEficiencia"],
    ];
    for (const [campoNota, campoComentario] of criterios) {
      const valor = data[campoNota];
      if ([1, 2, 5].includes(valor) && !data[campoComentario]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [campoComentario],
          message: `Debes justificar la calificación de ${campoNota} cuando la nota es 1, 2 o 5.`,
        });
      }
    }


    const tecnico = esRolTecnico(data.rolEvento);
    if (tecnico) {
      if (data.manejoEquipos === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manejoEquipos"],
          message: "El criterio de manejo de equipos es obligatorio para roles técnicos.",
        });
      } else if ([1, 2, 5].includes(data.manejoEquipos) && !data.comentarioManejoEquipos) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["comentarioManejoEquipos"],
          message: "Debes justificar la calificación de manejo de equipos cuando la nota es 1, 2 o 5.",
        });
      }
    } else if (data.manejoEquipos !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manejoEquipos"],
        message: "Manejo de equipos solo aplica cuando el rol del evento es técnico.",
      });
    }
  });