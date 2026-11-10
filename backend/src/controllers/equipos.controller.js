import * as equipoService from "../services/equipo.service.js";
import { parseId } from "../utils/http.js";

export async function listar(req, res, next) {
  try {
    const equipos = await equipoService.listarEquipos({
      fecha: req.query.fecha,
      eventoId: req.query.eventoId ? parseId(req.query.eventoId, "evento") : undefined,
      soloActivos: req.query.soloActivos === "true",
    });
    res.json(equipos);
  } catch (err) {
    next(err);
  }
}

export async function obtener(req, res, next) {
  try {
    res.json(await equipoService.obtenerEquipo(parseId(req.params.equipoId, "equipo")));
  } catch (err) {
    next(err);
  }
}

export async function crear(req, res, next) {
  try {
    res.status(201).json(await equipoService.crearEquipo(req.body));
  } catch (err) {
    next(err);
  }
}

export async function actualizar(req, res, next) {
  try {
    res.json(await equipoService.actualizarEquipo(parseId(req.params.equipoId, "equipo"), req.body));
  } catch (err) {
    next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    res.json(await equipoService.eliminarEquipo(parseId(req.params.equipoId, "equipo")));
  } catch (err) {
    next(err);
  }
}
