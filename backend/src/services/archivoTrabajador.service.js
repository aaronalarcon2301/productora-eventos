import prisma from "../config/prisma.js";
import { httpError } from "../utils/http.js";
import { normalizarRut } from "../utils/rut.js";
import { leerPlantilla } from "../utils/excelTrabajador.js";

export const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ARCHIVOS_POR_TRABAJADOR = 20;

// Tipo según la extensión (no se confía en el tipo que declara el navegador) y
// firma esperada al inicio del contenido para no aceptar archivos disfrazados.
const FORMATOS = {
  xlsx: { tipo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", firma: [0x50, 0x4b] },
  docx: { tipo: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", firma: [0x50, 0x4b] },
  xls: { tipo: "application/vnd.ms-excel", firma: [0xd0, 0xcf, 0x11, 0xe0] },
  pdf: { tipo: "application/pdf", firma: [0x25, 0x50, 0x44, 0x46] },
  png: { tipo: "image/png", firma: [0x89, 0x50, 0x4e, 0x47] },
  jpg: { tipo: "image/jpeg", firma: [0xff, 0xd8, 0xff] },
  jpeg: { tipo: "image/jpeg", firma: [0xff, 0xd8, 0xff] },
  csv: { tipo: "text/csv", firma: null },
};

export const EXTENSIONES_PERMITIDAS = Object.keys(FORMATOS);

function exigirContenido(contenido) {
  if (!Buffer.isBuffer(contenido) || contenido.length === 0) {
    throw httpError(400, "No se recibió ningún archivo.");
  }
  if (contenido.length > MAX_BYTES) {
    throw httpError(413, "El archivo supera el máximo de 5 MB.");
  }
}

export function limpiarNombre(nombre) {
  const base = String(nombre ?? "")
    .split(/[\\/]/)
    .pop()
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f"<>:*?|]/g, "")
    .trim();
  if (!base) throw httpError(400, "Indica el nombre del archivo.");
  if (base.length <= 150) return base;
  const punto = base.lastIndexOf(".");
  const extension = punto > 0 ? base.slice(punto) : "";
  return base.slice(0, 150 - extension.length) + extension;
}

function validarFormato(nombre, contenido) {
  const extension = nombre.includes(".") ? nombre.split(".").pop().toLowerCase() : "";
  const formato = FORMATOS[extension];
  if (!formato) {
    throw httpError(400, `Formato no permitido. Usa: ${EXTENSIONES_PERMITIDAS.join(", ")}.`);
  }
  if (formato.firma && !formato.firma.every((byte, i) => contenido[i] === byte)) {
    throw httpError(400, "El contenido del archivo no coincide con su extensión.");
  }
  return formato.tipo;
}

async function exigirTrabajador(trabajadorId) {
  const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId }, select: { id: true } });
  if (!trabajador) throw httpError(404, "Trabajador no encontrado.");
}

export async function importarDesdeExcel(contenido) {
  exigirContenido(contenido);
  const { datos, avisos } = await leerPlantilla(contenido);

  const rut = datos.rut ? normalizarRut(datos.rut) : "";
  if (rut) {
    const existente = await prisma.trabajador.findUnique({ where: { rut }, select: { nombre: true } });
    if (existente) {
      avisos.push(`Ya existe un trabajador con ese RUT (${existente.nombre}). Si lo guardas, el sistema lo rechazará.`);
    }
  }

  return { datos, avisos };
}

export async function listarArchivos(trabajadorId) {
  await exigirTrabajador(trabajadorId);
  return prisma.archivoTrabajador.findMany({
    where: { trabajadorId },
    select: { id: true, nombre: true, tipo: true, tamano: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function guardarArchivo(trabajadorId, nombreOriginal, contenido) {
  exigirContenido(contenido);
  const nombre = limpiarNombre(nombreOriginal);
  const tipo = validarFormato(nombre, contenido);
  await exigirTrabajador(trabajadorId);

  const cantidad = await prisma.archivoTrabajador.count({ where: { trabajadorId } });
  if (cantidad >= MAX_ARCHIVOS_POR_TRABAJADOR) {
    throw httpError(409, `Un trabajador puede tener hasta ${MAX_ARCHIVOS_POR_TRABAJADOR} archivos. Elimina alguno primero.`);
  }

  return prisma.archivoTrabajador.create({
    data: { trabajadorId, nombre, tipo, tamano: contenido.length, contenido },
    select: { id: true, nombre: true, tipo: true, tamano: true, createdAt: true },
  });
}

export async function obtenerArchivo(trabajadorId, archivoId) {
  const archivo = await prisma.archivoTrabajador.findFirst({ where: { id: archivoId, trabajadorId } });
  if (!archivo) throw httpError(404, "Archivo no encontrado.");
  return archivo;
}

export async function eliminarArchivo(trabajadorId, archivoId) {
  await obtenerArchivo(trabajadorId, archivoId);
  await prisma.archivoTrabajador.deleteMany({ where: { id: archivoId, trabajadorId } });
  return { mensaje: "Archivo eliminado." };
}
