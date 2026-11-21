import * as miPerfilService from "../services/miPerfil.service.js";
import { parseId } from "../utils/http.js";

export async function obtenerPerfil(req, res, next) {
  try {
    res.json(await miPerfilService.obtenerPerfil(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function actualizarPerfil(req, res, next) {
  try {
    res.json(await miPerfilService.actualizarPerfil(req.usuario.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function listarAsignaciones(req, res, next) {
  try {
    res.json(await miPerfilService.listarAsignaciones(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

export async function responderAsignacion(req, res, next) {
  try {
    const resultado = await miPerfilService.responderAsignacion(
      req.usuario.id,
      parseId(req.params.id, "asignación"),
      req.body
    );
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function listarEvaluaciones(req, res, next) {
  try {
    res.json(await miPerfilService.listarEvaluaciones(req.usuario.id));
  } catch (err) {
    next(err);
  }
}
