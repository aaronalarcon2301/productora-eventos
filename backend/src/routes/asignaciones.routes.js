import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { crearAsignacionSchema } from "../schemas/asignacion.schema.js";
import * as asignacionesController from "../controllers/asignaciones.controller.js";

const router = Router();

router.post("/", validate(crearAsignacionSchema), asignacionesController.crear);

router.get("/evento/:eventoId", asignacionesController.listarPorEvento);

router.get("/trabajador/:trabajadorId", asignacionesController.listarPorTrabajador);

router.delete("/:id", asignacionesController.eliminar);

export default router;
