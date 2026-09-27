import * as trabajadorService from "../services/trabajador.service.js";

export async function obtenerHistorial(req, res, next) {
  try {
    const trabajadorId = Number(req.params.trabajadorId);
    const historial = await trabajadorService.obtenerHistorial(trabajadorId);
    if (!historial) {
      return res.status(404).json({ error: "Trabajador no encontrado." });
    }
    res.json(historial);
  } catch (err) {
    next(err);
  }
}