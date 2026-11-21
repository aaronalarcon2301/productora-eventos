import * as archivos from "../services/archivoTrabajador.service.js";
import { generarPlantilla } from "../utils/excelTrabajador.js";
import { parseId } from "../utils/http.js";

export async function plantilla(req, res, next) {
  try {
    const buffer = await generarPlantilla();
    res.set({
      "Content-Type": archivosTipoXlsx,
      "Content-Disposition": 'attachment; filename="plantilla-trabajador.xlsx"',
      "Content-Length": buffer.length,
      "X-Content-Type-Options": "nosniff",
    });
    res.end(buffer);
  } catch (err) {
    next(err);
  }
}

const archivosTipoXlsx = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function importar(req, res, next) {
  try {
    res.json(await archivos.importarDesdeExcel(req.body));
  } catch (err) {
    next(err);
  }
}

export async function listar(req, res, next) {
  try {
    res.json(await archivos.listarArchivos(parseId(req.params.trabajadorId, "trabajador")));
  } catch (err) {
    next(err);
  }
}

export async function subir(req, res, next) {
  try {
    const archivo = await archivos.guardarArchivo(
      parseId(req.params.trabajadorId, "trabajador"),
      req.query.nombre,
      req.body
    );
    res.status(201).json(archivo);
  } catch (err) {
    next(err);
  }
}

export async function descargar(req, res, next) {
  try {
    const archivo = await archivos.obtenerArchivo(
      parseId(req.params.trabajadorId, "trabajador"),
      parseId(req.params.archivoId, "archivo")
    );
    const contenido = Buffer.from(archivo.contenido);
    const respaldoAscii = archivo.nombre.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
    res.set({
      "Content-Type": archivo.tipo,
      "Content-Disposition": `attachment; filename="${respaldoAscii}"; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`,
      "Content-Length": contenido.length,
      "X-Content-Type-Options": "nosniff",
    });
    res.end(contenido);
  } catch (err) {
    next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    res.json(
      await archivos.eliminarArchivo(
        parseId(req.params.trabajadorId, "trabajador"),
        parseId(req.params.archivoId, "archivo")
      )
    );
  } catch (err) {
    next(err);
  }
}
