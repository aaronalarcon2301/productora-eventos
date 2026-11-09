import * as asignacionService from "../services/asignacion.service.js";
import { parseId } from "../utils/http.js";

export async function crear(req, res, next) {
  try {
    const asignacion = await asignacionService.asignarTrabajador(req.body);
    res.status(201).json(asignacion);
  } catch (err) {
    next(err);
  }
}

export async function listarPorEvento(req, res, next) {
  try {
    const asignaciones = await asignacionService.listarAsignacionesPorEvento(
      parseId(req.params.eventoId, "evento")
    );
    res.json(asignaciones);
  } catch (err) {
    next(err);
  }
}

export async function listarPorTrabajador(req, res, next) {
  try {
    const asignaciones = await asignacionService.listarAsignacionesPorTrabajador(
      parseId(req.params.trabajadorId, "trabajador")
    );
    res.json(asignaciones);
  } catch (err) {
    next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    const resultado = await asignacionService.eliminarAsignacion(parseId(req.params.id, "asignación"));
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}
