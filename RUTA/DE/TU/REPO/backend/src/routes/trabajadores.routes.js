import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  crearTrabajadorSchema,
  actualizarTrabajadorSchema,
} from "../schemas/trabajador.schema.js";
import { accesoSchema } from "../schemas/acceso.schema.js";
import * as trabajadoresController from "../controllers/trabajadores.controller.js";
import * as accesoController from "../controllers/accesoTrabajador.controller.js";

const router = Router();

router.get("/", trabajadoresController.listar);

router.post("/", validate(crearTrabajadorSchema), trabajadoresController.crear);

router.get("/:trabajadorId/historial", trabajadoresController.obtenerHistorial);

router.get("/:trabajadorId/acceso", accesoController.obtener);
router.put("/:trabajadorId/acceso", validate(accesoSchema), accesoController.guardar);
router.delete("/:trabajadorId/acceso", accesoController.desactivar);

router.get("/:trabajadorId", trabajadoresController.obtener);

router.put("/:trabajadorId", validate(actualizarTrabajadorSchema), trabajadoresController.actualizar);

router.delete("/:trabajadorId", trabajadoresController.eliminar);

export default router;
