import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  crearTrabajadorSchema,
  actualizarTrabajadorSchema,
} from "../schemas/trabajador.schema.js";
import * as trabajadoresController from "../controllers/trabajadores.controller.js";

const router = Router();

// GET /api/trabajadores            (?asignables=true -> solo activos y no bloqueados)
router.get("/", trabajadoresController.listar);

// POST /api/trabajadores
router.post("/", validate(crearTrabajadorSchema), trabajadoresController.crear);

// GET /api/trabajadores/:trabajadorId/historial
router.get("/:trabajadorId/historial", trabajadoresController.obtenerHistorial);

// GET /api/trabajadores/:trabajadorId
router.get("/:trabajadorId", trabajadoresController.obtener);

// PUT /api/trabajadores/:trabajadorId
router.put("/:trabajadorId", validate(actualizarTrabajadorSchema), trabajadoresController.actualizar);

// DELETE /api/trabajadores/:trabajadorId  (baja lógica si tiene historial)
router.delete("/:trabajadorId", trabajadoresController.eliminar);

export default router;
