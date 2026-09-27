import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { crearIncidenteSchema } from "../schemas/incidente.schema.js";
import * as incidentesController from "../controllers/incidentes.controller.js";

const router = Router();

// POST /api/incidentes  { tipo: "INASISTENCIA" | "FALTA_GRAVE", ... }
router.post("/", validate(crearIncidenteSchema), incidentesController.crear);

// GET /api/incidentes/trabajador/:trabajadorId
router.get("/trabajador/:trabajadorId", incidentesController.listarPorTrabajador);

export default router;