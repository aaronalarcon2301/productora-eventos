import { Router } from "express";
import * as finalizacionController from "../controllers/eventoFinalizacion.controller.js";

const router = Router();

router.post("/:id/finalizar", finalizacionController.finalizar);

router.post("/:id/reabrir", finalizacionController.reabrir);

export default router;
