import { Router } from "express";
import * as trabajadoresController from "../controllers/trabajadores.controller.js";

const router = Router();

// GET /api/trabajadores/:trabajadorId/historial
router.get("/:trabajadorId/historial", trabajadoresController.obtenerHistorial);

export default router;