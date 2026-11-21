import ExcelJS from "exceljs";
import { ROLES } from "../schemas/evaluacion.schema.js";
import {
  TALLAS,
  BANCOS,
  DIAS_SEMANA,
  crearTrabajadorSchema,
} from "../schemas/trabajador.schema.js";
import { httpError } from "./http.js";

// Etiquetas tal como las ve el usuario en el formulario del sistema.
const ETIQUETAS_ROL = {
  TECNICO_SONIDO: "Técnico de sonido",
  TECNICO_ILUMINACION: "Técnico de iluminación",
  MONTAJISTA: "Montajista",
  ANIMADOR: "Animador",
  GARZON: "Garzón",
  ANFITRION: "Anfitrión",
  ASEO_LOGISTICA: "Aseo y logística",
  SEGURIDAD: "Seguridad",
};

const ETIQUETAS_TURNO = { DIURNO: "Diurno", NOCTURNO: "Nocturno", AMBOS: "Diurno y nocturno" };

const ETIQUETAS_CUENTA = {
  CORRIENTE: "Cuenta corriente",
  VISTA: "Cuenta vista",
  CUENTA_RUT: "Cuenta RUT",
  AHORRO: "Cuenta de ahorro",
};

const ALIAS_TURNO = {
  diurno: "DIURNO",
  nocturno: "NOCTURNO",
  "diurno y nocturno": "AMBOS",
  "diurno/nocturno": "AMBOS",
  "diurno - nocturno": "AMBOS",
  ambos: "AMBOS",
  "ambos turnos": "AMBOS",
};

const ALIAS_CUENTA = {
  "cuenta corriente": "CORRIENTE",
  corriente: "CORRIENTE",
  "cuenta vista": "VISTA",
  vista: "VISTA",
  "cuenta rut": "CUENTA_RUT",
  rut: "CUENTA_RUT",
  cuenta_rut: "CUENTA_RUT",
  "cuenta de ahorro": "AHORRO",
  "cuenta ahorro": "AHORRO",
  ahorro: "AHORRO",
};

const DIAS_ABREVIADOS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

// Orden y textos de la plantilla: calzan con el formulario "Registrar trabajador".
const SECCIONES = [
  {
    titulo: "1. Datos personales",
    campos: [
      { clave: "nombre", etiqueta: "Nombre completo", requerido: true, ayuda: "Ej: María González Soto" },
      { clave: "rut", etiqueta: "RUT", requerido: true, ayuda: "Con o sin puntos. Ej: 12.345.678-5" },
      { clave: "telefono", etiqueta: "Teléfono", requerido: true, ayuda: "Ej: +56 9 1234 5678" },
      { clave: "email", etiqueta: "Correo electrónico", requerido: true, ayuda: "Ej: nombre@correo.cl" },
      { clave: "comuna", etiqueta: "Comuna", ayuda: "Ej: Concepción" },
    ],
  },
  {
    titulo: "2. Información laboral",
    campos: [
      { clave: "rolPrincipal", etiqueta: "Cargo principal", requerido: true, ayuda: "Elige de la lista", lista: "roles" },
      { clave: "aniosExperiencia", etiqueta: "Años de experiencia", ayuda: "Número entero. Ej: 3" },
      {
        clave: "disponibilidadDias",
        etiqueta: "Disponibilidad semanal",
        ayuda: "Días separados por coma. Ej: Lun, Mar, Vie (también sirve «Lun a Vie»)",
      },
      { clave: "disponibilidadTurno", etiqueta: "Turno", ayuda: "Elige de la lista", lista: "turnos" },
    ],
  },
  {
    titulo: "3. Información administrativa",
    campos: [
      { clave: "tallaUniforme", etiqueta: "Talla de uniforme", ayuda: "Elige de la lista", lista: "tallas" },
      { clave: "banco", etiqueta: "Banco", ayuda: "Opcional, pero si pones un dato bancario completa los tres", lista: "bancos" },
      { clave: "tipoCuenta", etiqueta: "Tipo de cuenta", ayuda: "Elige de la lista", lista: "cuentas" },
      { clave: "numeroCuenta", etiqueta: "Número de cuenta", ayuda: "Solo dígitos (entre 6 y 20)" },
    ],
  },
];

const CAMPOS = SECCIONES.flatMap((s) => s.campos);

const LISTAS = {
  roles: ROLES.map((r) => ETIQUETAS_ROL[r] ?? r),
  turnos: Object.values(ETIQUETAS_TURNO),
  tallas: TALLAS,
  bancos: BANCOS,
  cuentas: Object.values(ETIQUETAS_CUENTA),
};

export function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export async function generarPlantilla() {
  const libro = new ExcelJS.Workbook();
  libro.creator = "NES Producciones";
  const hoja = libro.addWorksheet("Trabajador");
  const listas = libro.addWorksheet("Listas", { state: "hidden" });

  hoja.columns = [{ width: 30 }, { width: 38 }, { width: 62 }];

  hoja.mergeCells("A1:C1");
  hoja.getCell("A1").value = "Ficha de trabajador · NES Producciones";
  hoja.getCell("A1").font = { bold: true, size: 14 };
  hoja.mergeCells("A2:C2");
  hoja.getCell("A2").value =
    "Completa la columna «Valor». Los campos con * son obligatorios. No cambies los nombres de la columna «Campo».";
  hoja.getCell("A2").font = { italic: true, color: { argb: "FF666666" } };

  const cabecera = hoja.getRow(4);
  cabecera.values = ["Campo", "Valor", "Ayuda"];
  cabecera.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cabecera.eachCell((celda) => {
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2430" } };
  });

  // Columnas de las listas desplegables en la hoja oculta.
  const rangos = {};
  Object.entries(LISTAS).forEach(([nombre, valores], i) => {
    valores.forEach((v, fila) => {
      listas.getCell(fila + 1, i + 1).value = v;
    });
    const col = String.fromCharCode(65 + i);
    rangos[nombre] = `Listas!$${col}$1:$${col}$${valores.length}`;
  });

  let fila = 5;
  for (const seccion of SECCIONES) {
    const filaSeccion = hoja.getRow(fila++);
    filaSeccion.getCell(1).value = seccion.titulo;
    filaSeccion.getCell(1).font = { bold: true, color: { argb: "FFB8741A" } };

    for (const campo of seccion.campos) {
      const f = hoja.getRow(fila++);
      f.getCell(1).value = campo.requerido ? `${campo.etiqueta} *` : campo.etiqueta;
      f.getCell(1).font = { bold: Boolean(campo.requerido) };
      f.getCell(3).value = campo.ayuda;
      f.getCell(3).font = { color: { argb: "FF888888" } };

      const valor = f.getCell(2);
      valor.numFmt = "@"; // texto: conserva el RUT, los ceros y los números largos
      valor.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF8E6" } };
      valor.border = { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } };
      if (campo.lista) {
        valor.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [rangos[campo.lista]],
          showErrorMessage: true,
          errorTitle: "Valor no válido",
          error: "Elige una opción de la lista.",
        };
      }
    }
    fila++;
  }

  return Buffer.from(await libro.xlsx.writeBuffer());
}

function textoDeCelda(celda) {
  let valor = celda.value;
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object" && !(valor instanceof Date)) {
    if (Array.isArray(valor.richText)) valor = valor.richText.map((t) => t.text).join("");
    else if (valor.result !== undefined) valor = valor.result;
    else if (valor.text !== undefined) valor = typeof valor.text === "object" ? valor.text.richText?.map((t) => t.text).join("") ?? "" : valor.text;
    else valor = "";
  }
  if (valor instanceof Date) return "";
  return String(valor).trim();
}

function buscarEnLista(texto, valores) {
  const buscado = normalizarTexto(texto);
  return valores.find((v) => normalizarTexto(v) === buscado) ?? null;
}

function interpretarDias(texto) {
  const normal = normalizarTexto(texto).replace(/\s+y\s+/g, ",");
  const dias = new Set();
  const indice = (t) => DIAS_ABREVIADOS.indexOf(t.slice(0, 3));

  // Rangos: "lun a vie", "lunes-viernes"
  const sinRangos = normal.replace(/([a-z]{3,})\s*(?:a|al|-)\s*([a-z]{3,})/g, (_, desde, hasta) => {
    const i = indice(desde);
    const j = indice(hasta);
    if (i === -1 || j === -1) return _;
    for (let k = i; k !== (j + 1) % 7; k = (k + 1) % 7) {
      dias.add(DIAS_SEMANA[k]);
      if (dias.size > 7) break;
    }
    dias.add(DIAS_SEMANA[j]);
    return " ";
  });

  const desconocidos = [];
  for (const token of sinRangos.split(/[,;/\s]+/).filter(Boolean)) {
    const i = indice(token);
    if (i === -1) desconocidos.push(token);
    else dias.add(DIAS_SEMANA[i]);
  }
  return { dias: DIAS_SEMANA.filter((d) => dias.has(d)), desconocidos };
}

/**
 * Lee la plantilla de trabajador y devuelve los datos con la misma forma del formulario
 * más una lista de avisos para que el usuario revise antes de guardar. No guarda nada.
 */
export async function leerPlantilla(buffer) {
  const libro = new ExcelJS.Workbook();
  try {
    await libro.xlsx.load(buffer);
  } catch {
    throw httpError(400, "No se pudo leer el archivo. Sube la plantilla en formato .xlsx.");
  }

  const hoja = libro.getWorksheet("Trabajador") ?? libro.worksheets[0];
  if (!hoja) throw httpError(400, "El archivo no tiene hojas.");

  const crudos = {};
  const limite = Math.min(hoja.rowCount, 200);
  for (let n = 1; n <= limite; n++) {
    const etiqueta = normalizarTexto(textoDeCelda(hoja.getCell(n, 1)));
    if (!etiqueta) continue;
    const campo = CAMPOS.find((c) => normalizarTexto(c.etiqueta) === etiqueta);
    if (campo && crudos[campo.clave] === undefined) crudos[campo.clave] = textoDeCelda(hoja.getCell(n, 2));
  }

  if (crudos.nombre === undefined || crudos.rut === undefined) {
    throw httpError(400, "El archivo no parece la plantilla de trabajador. Descarga la plantilla y vuelve a intentarlo.");
  }

  const avisos = [];
  const datos = {
    nombre: crudos.nombre ?? "",
    rut: crudos.rut ?? "",
    email: crudos.email ?? "",
    telefono: (crudos.telefono ?? "").replace(/\s+/g, " "),
    comuna: crudos.comuna ?? "",
    rolPrincipal: "",
    aniosExperiencia: "",
    disponibilidadDias: [],
    disponibilidadTurno: "",
    tallaUniforme: "",
    banco: "",
    tipoCuenta: "",
    numeroCuenta: crudos.numeroCuenta ?? "",
  };

  if (crudos.rolPrincipal) {
    const porEtiqueta = ROLES.find((r) => normalizarTexto(ETIQUETAS_ROL[r]) === normalizarTexto(crudos.rolPrincipal));
    const porValor = ROLES.find((r) => normalizarTexto(r) === normalizarTexto(crudos.rolPrincipal).replace(/ /g, "_"));
    datos.rolPrincipal = porEtiqueta ?? porValor ?? "";
    if (!datos.rolPrincipal) avisos.push(`No reconocí el cargo «${crudos.rolPrincipal}». Elígelo en el formulario.`);
  }

  if (crudos.aniosExperiencia) {
    const numero = Number(crudos.aniosExperiencia.replace(",", "."));
    if (Number.isFinite(numero)) datos.aniosExperiencia = String(numero);
    else avisos.push(`Los años de experiencia «${crudos.aniosExperiencia}» no son un número.`);
  }

  if (crudos.disponibilidadDias) {
    const { dias, desconocidos } = interpretarDias(crudos.disponibilidadDias);
    datos.disponibilidadDias = dias;
    if (desconocidos.length) avisos.push(`No reconocí estos días de disponibilidad: ${desconocidos.join(", ")}.`);
  }

  if (crudos.disponibilidadTurno) {
    datos.disponibilidadTurno = ALIAS_TURNO[normalizarTexto(crudos.disponibilidadTurno)] ?? "";
    if (!datos.disponibilidadTurno) avisos.push(`No reconocí el turno «${crudos.disponibilidadTurno}».`);
  }

  if (crudos.tallaUniforme) {
    datos.tallaUniforme = TALLAS.find((t) => t === crudos.tallaUniforme.trim().toUpperCase()) ?? "";
    if (!datos.tallaUniforme) avisos.push(`No reconocí la talla «${crudos.tallaUniforme}».`);
  }

  if (crudos.banco) {
    datos.banco = buscarEnLista(crudos.banco, BANCOS) ?? "";
    if (!datos.banco) avisos.push(`El banco «${crudos.banco}» no está en la lista. Elígelo en el formulario.`);
  }

  if (crudos.tipoCuenta) {
    datos.tipoCuenta = ALIAS_CUENTA[normalizarTexto(crudos.tipoCuenta)] ?? "";
    if (!datos.tipoCuenta) avisos.push(`No reconocí el tipo de cuenta «${crudos.tipoCuenta}».`);
  }

  // Misma validación que al guardar, para avisar de errores antes de que el usuario pulse Guardar.
  const probar = crearTrabajadorSchema.safeParse({
    ...datos,
    aniosExperiencia: datos.aniosExperiencia === "" ? null : Number(datos.aniosExperiencia),
  });
  if (!probar.success) {
    for (const problema of probar.error.issues) {
      if (!avisos.includes(problema.message)) avisos.push(problema.message);
    }
  }

  return { datos, avisos };
}
