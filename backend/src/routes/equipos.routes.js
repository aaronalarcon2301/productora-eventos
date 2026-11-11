import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { crearEquipoSchema, actualizarEquipoSchema } from "../schemas/equipo.schema.js";
import * as equiposController from "../controllers/equipos.controller.js";

const router = Router();

router.get("/", equiposController.listar);

router.post("/", validate(crearEquipoSchema), equiposController.crear);

router.get("/:equipoId", equiposController.obtener);

router.put("/:equipoId", validate(actualizarEquipoSchema), equiposController.actualizar);

router.delete("/:equipoId", equiposController.eliminar);

export default router;
