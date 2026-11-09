import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  crearEvaluacionSchema,
  editarEvaluacionSchema,
  eliminarEvaluacionSchema,
} from "../schemas/evaluacion.schema.js";
import * as evaluacionesController from "../controllers/evaluaciones.controller.js";

const router = Router();

// POST /api/evaluaciones
router.post("/", validate(crearEvaluacionSchema), evaluacionesController.crear);

// GET /api/evaluaciones/trabajador/:trabajadorId
router.get("/trabajador/:trabajadorId", evaluacionesController.listarPorTrabajador);

// PUT /api/evaluaciones/:id
router.put("/:id", validate(editarEvaluacionSchema), evaluacionesController.actualizar);

// DELETE /api/evaluaciones/:id   { motivo: "...", adminId?: n }
router.delete("/:id", validate(eliminarEvaluacionSchema), evaluacionesController.eliminar);

export default router;
