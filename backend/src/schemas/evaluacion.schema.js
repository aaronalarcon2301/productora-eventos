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
const comentarioOpcional = z.string().trim().min(1).optional();


export const SUBINDICADORES_BASE = [
  ["llegada", "comentarioLlegada"],
  ["cumplimientoHorarios", "comentarioCumplimientoHorarios"],
  ["tiemposPreparacion", "comentarioTiemposPreparacion"],
  ["comunicacion", "comentarioComunicacion"],
  ["atencion", "comentarioAtencion"],
  ["conducta", "comentarioConducta"],
  ["cumplimiento", "comentarioCumplimiento"],
  ["autonomia", "comentarioAutonomia"],
  ["resolucion", "comentarioResolucion"],
];


export const SUBINDICADORES_TECNICOS = [
  ["usoEquipos", "comentarioUsoEquipos"],
  ["cuidadoEquipos", "comentarioCuidadoEquipos"],
  ["resolucionTecnica", "comentarioResolucionTecnica"],
];

const shape = {
  trabajadorId: z.number().int().positive(),
  eventoId: z.number().int().positive(),
  rolEvento: z.enum(ROLES),
  adminId: z.number().int().positive().optional(),
};
for (const [campo, campoComentario] of SUBINDICADORES_BASE) {
  shape[campo] = nota;
  shape[campoComentario] = comentarioOpcional;
}
for (const [campo, campoComentario] of SUBINDICADORES_TECNICOS) {
  shape[campo] = nota.optional();
  shape[campoComentario] = comentarioOpcional;
}

export const crearEvaluacionSchema = z.object(shape).superRefine((data, ctx) => {
  
  for (const [campo, campoComentario] of SUBINDICADORES_BASE) {
    if ([1, 2, 5].includes(data[campo]) && !data[campoComentario]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [campoComentario],
        message: `Debes justificar la calificación de "${campo}" cuando la nota es 1, 2 o 5.`,
      });
    }
  }


  const tecnico = esRolTecnico(data.rolEvento);
  for (const [campo, campoComentario] of SUBINDICADORES_TECNICOS) {
    if (tecnico) {
      if (data[campo] === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [campo],
          message: `"${campo}" es obligatorio para roles técnicos.`,
        });
      } else if ([1, 2, 5].includes(data[campo]) && !data[campoComentario]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [campoComentario],
          message: `Debes justificar la calificación de "${campo}" cuando la nota es 1, 2 o 5.`,
        });
      }
    } else if (data[campo] !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [campo],
        message: `"${campo}" solo aplica cuando el rol del evento es técnico.`,
      });
    }
  }
});