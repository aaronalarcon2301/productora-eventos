import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  crearReservaEquipoSchema,
  devolverReservaEquipoSchema,
} from "../schemas/reservaEquipo.schema.js";
import * as reservasController from "../controllers/reservasEquipo.controller.js";

const router = Router();

// POST /api/reservas-equipo   { equipoId, eventoId, cantidad, responsableId? }
router.post("/", validate(crearReservaEquipoSchema), reservasController.crear);

// GET /api/reservas-equipo/evento/:eventoId
router.get("/evento/:eventoId", reservasController.listarPorEvento);

// POST /api/reservas-equipo/:id/entregar
router.post("/:id/entregar", reservasController.entregar);

// POST /api/reservas-equipo/:id/devolver   { cantidadDanada?, cantidadFaltante?, observacion? }
router.post("/:id/devolver", validate(devolverReservaEquipoSchema), reservasController.devolver);

// DELETE /api/reservas-equipo/:id   (solo si aún no se entregó)
router.delete("/:id", reservasController.eliminar);

export default router;
