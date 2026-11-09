import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { crearAsignacionSchema } from "../schemas/asignacion.schema.js";
import * as asignacionesController from "../controllers/asignaciones.controller.js";

const router = Router();

// POST /api/asignaciones   { trabajadorId, eventoId, rol? }
router.post("/", validate(crearAsignacionSchema), asignacionesController.crear);

// GET /api/asignaciones/evento/:eventoId
router.get("/evento/:eventoId", asignacionesController.listarPorEvento);

// GET /api/asignaciones/trabajador/:trabajadorId
router.get("/trabajador/:trabajadorId", asignacionesController.listarPorTrabajador);

// DELETE /api/asignaciones/:id
router.delete("/:id", asignacionesController.eliminar);

export default router;
