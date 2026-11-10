import { Router } from "express";
import * as finalizacionController from "../controllers/eventoFinalizacion.controller.js";

const router = Router();

// POST /api/eventos/:id/finalizar   (solo desde el día del evento; no cancelados)
router.post("/:id/finalizar", finalizacionController.finalizar);

// POST /api/eventos/:id/reabrir     (solo si se finalizó a mano y aún no tiene evaluaciones)
router.post("/:id/reabrir", finalizacionController.reabrir);

export default router;
