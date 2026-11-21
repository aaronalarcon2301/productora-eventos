import express, { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  crearTrabajadorSchema,
  actualizarTrabajadorSchema,
} from "../schemas/trabajador.schema.js";
import { accesoSchema } from "../schemas/acceso.schema.js";
import * as trabajadoresController from "../controllers/trabajadores.controller.js";
import * as accesoController from "../controllers/accesoTrabajador.controller.js";
import * as archivoController from "../controllers/archivoTrabajador.controller.js";
import { httpError } from "../utils/http.js";

const router = Router();

// Los archivos viajan como cuerpo binario (no JSON). El nombre va en ?nombre=.
const recibirArchivo = [
  express.raw({ type: () => true, limit: "5mb" }),
  (err, req, res, next) =>
    next(err.type === "entity.too.large" ? httpError(413, "El archivo supera el máximo de 5 MB.") : err),
];

router.get("/", trabajadoresController.listar);

router.post("/", validate(crearTrabajadorSchema), trabajadoresController.crear);

router.get("/plantilla", archivoController.plantilla);
router.post("/importar-excel", ...recibirArchivo, archivoController.importar);

router.get("/:trabajadorId/historial", trabajadoresController.obtenerHistorial);

router.get("/:trabajadorId/archivos", archivoController.listar);
router.post("/:trabajadorId/archivos", ...recibirArchivo, archivoController.subir);
router.get("/:trabajadorId/archivos/:archivoId", archivoController.descargar);
router.delete("/:trabajadorId/archivos/:archivoId", archivoController.eliminar);

router.get("/:trabajadorId/acceso", accesoController.obtener);
router.put("/:trabajadorId/acceso", validate(accesoSchema), accesoController.guardar);
router.delete("/:trabajadorId/acceso", accesoController.desactivar);

router.get("/:trabajadorId", trabajadoresController.obtener);

router.put("/:trabajadorId", validate(actualizarTrabajadorSchema), trabajadoresController.actualizar);

router.delete("/:trabajadorId", trabajadoresController.eliminar);

export default router;
