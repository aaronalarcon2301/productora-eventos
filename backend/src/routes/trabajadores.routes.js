import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  crearTrabajadorSchema,
  actualizarTrabajadorSchema,
} from "../schemas/trabajador.schema.js";
import * as trabajadoresController from "../controllers/trabajadores.controller.js";

const router = Router();

router.get("/", trabajadoresController.listar);

router.post("/", validate(crearTrabajadorSchema), trabajadoresController.crear);

router.get("/:trabajadorId/historial", trabajadoresController.obtenerHistorial);

router.get("/:trabajadorId", trabajadoresController.obtener);

router.put("/:trabajadorId", validate(actualizarTrabajadorSchema), trabajadoresController.actualizar);

router.delete("/:trabajadorId", trabajadoresController.eliminar);

export default router;
