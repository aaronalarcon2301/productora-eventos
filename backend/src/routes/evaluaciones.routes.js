import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  crearEvaluacionSchema,
  editarEvaluacionSchema,
  eliminarEvaluacionSchema,
} from "../schemas/evaluacion.schema.js";
import * as evaluacionesController from "../controllers/evaluaciones.controller.js";

const router = Router();

router.post("/", validate(crearEvaluacionSchema), evaluacionesController.crear);

router.get("/trabajador/:trabajadorId", evaluacionesController.listarPorTrabajador);

router.put("/:id", validate(editarEvaluacionSchema), evaluacionesController.actualizar);

router.delete("/:id", validate(eliminarEvaluacionSchema), evaluacionesController.eliminar);

export default router;
