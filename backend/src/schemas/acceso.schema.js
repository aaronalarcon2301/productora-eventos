import { z } from "zod";

export const accesoSchema = z.object({
  password: z
    .string({ error: "Ingresa una contraseña." })
    .min(10, "La contraseña debe tener al menos 10 caracteres.")
    .max(100, "La contraseña no puede superar los 100 caracteres."),
});
