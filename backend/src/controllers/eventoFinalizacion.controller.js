import * as finalizacionService from "../services/eventoFinalizacion.service.js";
import { parseId } from "../utils/http.js";

export async function finalizar(req, res, next) {
  try {
    res.json(await finalizacionService.finalizarEvento(parseId(req.params.id, "evento")));
  } catch (err) {
    next(err);
  }
}

export async function reabrir(req, res, next) {
  try {
    res.json(await finalizacionService.reabrirEvento(parseId(req.params.id, "evento")));
  } catch (err) {
    next(err);
  }
}
