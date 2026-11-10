import * as reservaService from "../services/reservaEquipo.service.js";
import { parseId } from "../utils/http.js";

export async function crear(req, res, next) {
  try {
    res.status(201).json(await reservaService.crearReserva(req.body));
  } catch (err) {
    next(err);
  }
}

export async function listarPorEvento(req, res, next) {
  try {
    res.json(await reservaService.listarReservasPorEvento(parseId(req.params.eventoId, "evento")));
  } catch (err) {
    next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    res.json(await reservaService.eliminarReserva(parseId(req.params.id, "reserva")));
  } catch (err) {
    next(err);
  }
}

export async function entregar(req, res, next) {
  try {
    res.json(await reservaService.registrarEntrega(parseId(req.params.id, "reserva")));
  } catch (err) {
    next(err);
  }
}

export async function devolver(req, res, next) {
  try {
    res.json(await reservaService.registrarDevolucion(parseId(req.params.id, "reserva"), req.body));
  } catch (err) {
    next(err);
  }
}
