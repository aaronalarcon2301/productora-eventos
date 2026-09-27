import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { crearEvaluacionSchema } from "../schemas/evaluacion.schema.js";
import * as evaluacionesController from "../controllers/evaluaciones.controller.js";

const router = Router();

// POST /api/evaluaciones
router.post("/", validate(crearEvaluacionSchema), evaluacionesController.crear);

// GET /api/evaluaciones/trabajador/:trabajadorId
router.get("/trabajador/:trabajadorId", evaluacionesController.listarPorTrabajador);

export default router;