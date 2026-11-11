import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  crearReservaEquipoSchema,
  devolverReservaEquipoSchema,
} from "../schemas/reservaEquipo.schema.js";
import * as reservasController from "../controllers/reservasEquipo.controller.js";

const router = Router();

router.post("/", validate(crearReservaEquipoSchema), reservasController.crear);

router.get("/evento/:eventoId", reservasController.listarPorEvento);

router.post("/:id/entregar", reservasController.entregar);

router.post("/:id/devolver", validate(devolverReservaEquipoSchema), reservasController.devolver);

router.delete("/:id", reservasController.eliminar);

export default router;
