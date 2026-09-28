import * as incidenteService from "../services/incidente.service.js";
 
export async function crear(req, res, next) {
  try {
    const incidente = await incidenteService.crearIncidente(req.body);
    res.status(201).json(incidente);
  } catch (err) {

    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}
 
export async function listarPorTrabajador(req, res, next) {
  try {
    const trabajadorId = Number(req.params.trabajadorId);
    const incidentes = await incidenteService.listarIncidentesPorTrabajador(trabajadorId);
    res.json(incidentes);
  } catch (err) {
    next(err);
  }
}