// Utilidades para el RUT chileno.

// "12.345.678-5", "12345678-5" o "123456785" -> "12345678-5"
export function normalizarRut(valor) {
  const limpio = String(valor).replace(/[.\s]/g, "").toUpperCase();
  if (limpio.includes("-")) return limpio;
  return limpio.length > 1 ? `${limpio.slice(0, -1)}-${limpio.slice(-1)}` : limpio;
}

// Dígito verificador por módulo 11.
export function calcularDv(cuerpo) {
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

export function validarRut(valor) {
  const partes = /^(\d{7,8})-([\dK])$/.exec(normalizarRut(valor));
  return Boolean(partes) && calcularDv(partes[1]) === partes[2];
}
