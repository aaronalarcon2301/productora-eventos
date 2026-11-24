import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { actualizarMiPerfilSchema, cambiarPasswordSchema, responderAsignacionSchema } from "../schemas/miPerfil.schema.js";
import * as miPerfilController from "../controllers/miPerfil.controller.js";

const router = Router();

router.get("/", miPerfilController.obtenerPerfil);

router.patch("/", validate(actualizarMiPerfilSchema), miPerfilController.actualizarPerfil);

router.put("/password", validate(cambiarPasswordSchema), miPerfilController.cambiarPassword);

router.get("/asignaciones", miPerfilController.listarAsignaciones);

router.post(
  "/asignaciones/:id/respuesta",
  validate(responderAsignacionSchema),
  miPerfilController.responderAsignacion
);

router.get("/evaluaciones", miPerfilController.listarEvaluaciones);

export default router;
