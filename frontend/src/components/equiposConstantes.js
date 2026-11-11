export const CATEGORIAS = [
  { valor: 'SONIDO', etiqueta: 'Sonido' },
  { valor: 'ILUMINACION', etiqueta: 'Iluminación' },
  { valor: 'AUDIOVISUAL', etiqueta: 'Audiovisual' },
  { valor: 'MOBILIARIO', etiqueta: 'Mobiliario' },
  { valor: 'ESTRUCTURA', etiqueta: 'Estructura' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

export function etiquetaCategoria(valor) {
  return CATEGORIAS.find((c) => c.valor === valor)?.etiqueta ?? valor;
}

export const ESTADOS_STOCK = {
  DISPONIBLE: { texto: 'Disponible', clase: 'confirmed' },
  POCAS: { texto: 'Pocas unidades', clase: 'pending' },
  AGOTADO: { texto: 'Agotado ese día', clase: 'cancelled' },
  EN_MANTENCION: { texto: 'En mantención', clase: 'cancelled' },
  INACTIVO: { texto: 'Inactivo', clase: 'pending' },
};

export const ESTADOS_RESERVA = {
  RESERVADO: { texto: 'Reservado', clase: 'pending' },
  ENTREGADO: { texto: 'Entregado', clase: 'entregado' },
  DEVUELTO: { texto: 'Devuelto', clase: 'confirmed' },
};

export function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function formatearPrecio(valor) {
  return `$${Number(valor).toLocaleString('es-CL')}`;
}
