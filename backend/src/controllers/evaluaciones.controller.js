import * as evaluacionService from "../services/evaluacion.service.js";
import { parseId } from "../utils/http.js";

export async function crear(req, res, next) {
  try {
    const evaluacion = await evaluacionService.crearEvaluacion(req.body);
    res.status(201).json(evaluacion);
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
    const evaluaciones = await evaluacionService.obtenerEvaluacionesPorTrabajador(trabajadorId);
    res.json(evaluaciones);
  } catch (err) {
    next(err);
  }
}

export async function actualizar(req, res, next) {
  try {
    const evaluacion = await evaluacionService.actualizarEvaluacion(
      parseId(req.params.id, "evaluación"),
      req.body
    );
    res.json(evaluacion);
  } catch (err) {
    next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    const resultado = await evaluacionService.eliminarEvaluacion(
      parseId(req.params.id, "evaluación"),
      req.body
    );
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}
