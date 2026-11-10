import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { crearEquipoSchema, actualizarEquipoSchema } from "../schemas/equipo.schema.js";
import * as equiposController from "../controllers/equipos.controller.js";

const router = Router();

// GET /api/equipos   (?fecha=AAAA-MM-DD | ?eventoId=N, ?soloActivos=true) -> catálogo con disponibilidad
router.get("/", equiposController.listar);

// POST /api/equipos
router.post("/", validate(crearEquipoSchema), equiposController.crear);

// GET /api/equipos/:equipoId   (incluye el historial de uso)
router.get("/:equipoId", equiposController.obtener);

// PUT /api/equipos/:equipoId
router.put("/:equipoId", validate(actualizarEquipoSchema), equiposController.actualizar);

// DELETE /api/equipos/:equipoId   (baja lógica si tiene historial)
router.delete("/:equipoId", equiposController.eliminar);

export default router;
