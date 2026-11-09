import * as trabajadorService from "../services/trabajador.service.js";
import { parseId } from "../utils/http.js";

export async function listar(req, res, next) {
  try {
    const trabajadores = await trabajadorService.listarTrabajadores({
      asignables: req.query.asignables === "true",
    });
    res.json(trabajadores);
  } catch (err) {
    next(err);
  }
}

export async function obtener(req, res, next) {
  try {
    const trabajador = await trabajadorService.obtenerTrabajador(
      parseId(req.params.trabajadorId, "trabajador")
    );
    res.json(trabajador);
  } catch (err) {
    next(err);
  }
}

export async function crear(req, res, next) {
  try {
    const trabajador = await trabajadorService.crearTrabajador(req.body);
    res.status(201).json(trabajador);
  } catch (err) {
    next(err);
  }
}

export async function actualizar(req, res, next) {
  try {
    const trabajador = await trabajadorService.actualizarTrabajador(
      parseId(req.params.trabajadorId, "trabajador"),
      req.body
    );
    res.json(trabajador);
  } catch (err) {
    next(err);
  }
}

// Devuelve { accion: "ELIMINADO" | "INACTIVADO", mensaje }
export async function eliminar(req, res, next) {
  try {
    const resultado = await trabajadorService.eliminarTrabajador(
      parseId(req.params.trabajadorId, "trabajador")
    );
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function obtenerHistorial(req, res, next) {
  try {
    const trabajadorId = parseId(req.params.trabajadorId, "trabajador");
    const historial = await trabajadorService.obtenerHistorial(trabajadorId);
    if (!historial) {
      return res.status(404).json({ error: "Trabajador no encontrado." });
    }
    res.json(historial);
  } catch (err) {
    next(err);
  }
}
