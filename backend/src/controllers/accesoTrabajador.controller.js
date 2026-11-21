import * as accesoService from "../services/accesoTrabajador.service.js";
import { parseId } from "../utils/http.js";

export async function obtener(req, res, next) {
  try {
    res.json(await accesoService.obtenerAcceso(parseId(req.params.trabajadorId, "trabajador")));
  } catch (err) {
    next(err);
  }
}

export async function guardar(req, res, next) {
  try {
    const acceso = await accesoService.guardarAcceso(
      parseId(req.params.trabajadorId, "trabajador"),
      req.body.password
    );
    res.json(acceso);
  } catch (err) {
    next(err);
  }
}

export async function desactivar(req, res, next) {
  try {
    res.json(await accesoService.desactivarAcceso(parseId(req.params.trabajadorId, "trabajador")));
  } catch (err) {
    next(err);
  }
}
