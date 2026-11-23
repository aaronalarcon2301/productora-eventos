
import * as asignacionService from "../services/asignacion.service.js";

import { parseId } from "../utils/http.js";

import {
  enviarNotificacionTurno
} from "../services/notificacionTurno.service.js";

export async function crear(req, res, next) {
  try {
    const { turno, horaLlegada } = req.body;

    if (
      !['DIURNO', 'NOCTURNO'].includes(turno) ||
      typeof horaLlegada !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(horaLlegada)
    ) {
      return res.status(400).json({
        error: 'Debes indicar un turno y una hora de llegada válidos.'
      });
    }

    console.log('[Asignación] Datos recibidos:', {
      turno,
      horaLlegada
    });

    const asignacion =
      await asignacionService.asignarTrabajador(req.body);

    console.log('[Asignación] Datos guardados:', {
      id: asignacion.id,
      turno: asignacion.turno,
      horaLlegada: asignacion.horaLlegada
    });

    const correo =
      await enviarNotificacionTurno(asignacion.id);

    res.status(201).json({
      ...asignacion,
      notificacionEstado: correo.estado,
      correoMensaje: correo.mensaje
    });

  } catch (err) {
    next(err);
  }
}

export async function listarPorEvento(req, res, next) {
  try {
    const asignaciones =
      await asignacionService.listarAsignacionesPorEvento(
        parseId(req.params.eventoId, "evento")
      );

    res.json(asignaciones);

  } catch (err) {
    next(err);
  }
}

export async function listarPorTrabajador(req, res, next) {
  try {
    const asignaciones =
      await asignacionService.listarAsignacionesPorTrabajador(
        parseId(req.params.trabajadorId, "trabajador")
      );

    res.json(asignaciones);

  } catch (err) {
    next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    const resultado =
      await asignacionService.eliminarAsignacion(
        parseId(req.params.id, "asignación")
      );

    res.json(resultado);

  } catch (err) {
    next(err);
  }
}

export async function reintentarCorreo(
  req,
  res,
  next
) {
  try {
    const id = parseId(
      req.params.id,
      "asignación"
    );

    const resultado =
      await enviarNotificacionTurno(id);

    res.json(resultado);

  } catch (err) {
    next(err);
  }
}
