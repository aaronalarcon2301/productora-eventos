// Constantes compartidas por las pantallas de Personal.

export const ROLES = [
  { valor: 'TECNICO_SONIDO', etiqueta: 'Técnico de sonido' },
  { valor: 'TECNICO_ILUMINACION', etiqueta: 'Técnico de iluminación' },
  { valor: 'MONTAJISTA', etiqueta: 'Montajista' },
  { valor: 'ANIMADOR', etiqueta: 'Animador' },
  { valor: 'GARZON', etiqueta: 'Garzón' },
  { valor: 'ANFITRION', etiqueta: 'Anfitrión' },
  { valor: 'ASEO_LOGISTICA', etiqueta: 'Aseo y logística' },
  { valor: 'SEGURIDAD', etiqueta: 'Seguridad' },
];

export const ROLES_TECNICOS = ['TECNICO_SONIDO', 'TECNICO_ILUMINACION', 'MONTAJISTA'];

export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const DIAS = [
  { valor: 'LUNES', corto: 'Lun' },
  { valor: 'MARTES', corto: 'Mar' },
  { valor: 'MIERCOLES', corto: 'Mié' },
  { valor: 'JUEVES', corto: 'Jue' },
  { valor: 'VIERNES', corto: 'Vie' },
  { valor: 'SABADO', corto: 'Sáb' },
  { valor: 'DOMINGO', corto: 'Dom' },
];

export const TURNOS = [
  { valor: 'DIURNO', etiqueta: 'Diurno' },
  { valor: 'NOCTURNO', etiqueta: 'Nocturno' },
  { valor: 'AMBOS', etiqueta: 'Diurno y nocturno' },
];

export const TIPOS_CUENTA = [
  { valor: 'CORRIENTE', etiqueta: 'Cuenta corriente' },
  { valor: 'VISTA', etiqueta: 'Cuenta vista' },
  { valor: 'CUENTA_RUT', etiqueta: 'Cuenta RUT' },
  { valor: 'AHORRO', etiqueta: 'Cuenta de ahorro' },
];

export const BANCOS = [
  'Banco de Chile', 'BancoEstado', 'Banco Santander', 'BCI', 'Scotiabank', 'Banco Itaú',
  'Banco Falabella', 'Banco Security', 'Banco Ripley', 'Banco BICE', 'Banco Consorcio',
  'Banco Internacional', 'Coopeuch', 'Mercado Pago', 'Tenpo', 'Otro',
];

// "Lun, Mar, Sáb · Nocturno" o "Sin definir"
export function resumenDisponibilidad(trabajador) {
  const dias = DIAS.filter((d) => trabajador.disponibilidadDias?.includes(d.valor)).map((d) => d.corto);
  const turno = TURNOS.find((t) => t.valor === trabajador.disponibilidadTurno)?.etiqueta;
  const partes = [dias.join(', '), turno].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : 'Sin definir';
}

// Notas que exigen un comentario que las justifique.
export const NOTAS_CON_COMENTARIO = [1, 2, 5];

// Criterios de la evaluación (los mismos campos que valida el backend).
export const GRUPOS_EVALUACION = [
  {
    id: 'puntualidad',
    titulo: 'Puntualidad',
    promedio: 'promedioPuntualidad',
    criterios: [
      { campo: 'llegada', comentario: 'comentarioLlegada', etiqueta: 'Llegada' },
      { campo: 'cumplimientoHorarios', comentario: 'comentarioCumplimientoHorarios', etiqueta: 'Cumplimiento de horarios' },
      { campo: 'tiemposPreparacion', comentario: 'comentarioTiemposPreparacion', etiqueta: 'Tiempos de preparación' },
    ],
  },
  {
    id: 'trato',
    titulo: 'Trato con el cliente',
    promedio: 'promedioTrato',
    criterios: [
      { campo: 'comunicacion', comentario: 'comentarioComunicacion', etiqueta: 'Comunicación' },
      { campo: 'atencion', comentario: 'comentarioAtencion', etiqueta: 'Atención' },
      { campo: 'conducta', comentario: 'comentarioConducta', etiqueta: 'Conducta' },
    ],
  },
  {
    id: 'eficiencia',
    titulo: 'Eficiencia',
    promedio: 'promedioEficiencia',
    criterios: [
      { campo: 'cumplimiento', comentario: 'comentarioCumplimiento', etiqueta: 'Cumplimiento de tareas' },
      { campo: 'autonomia', comentario: 'comentarioAutonomia', etiqueta: 'Autonomía' },
      { campo: 'resolucion', comentario: 'comentarioResolucion', etiqueta: 'Resolución de problemas' },
    ],
  },
  {
    id: 'manejoEquipos',
    titulo: 'Manejo de equipos',
    promedio: 'promedioManejoEquipos',
    soloTecnico: true,
    criterios: [
      { campo: 'usoEquipos', comentario: 'comentarioUsoEquipos', etiqueta: 'Uso de equipos' },
      { campo: 'cuidadoEquipos', comentario: 'comentarioCuidadoEquipos', etiqueta: 'Cuidado de equipos' },
      { campo: 'resolucionTecnica', comentario: 'comentarioResolucionTecnica', etiqueta: 'Resolución técnica' },
    ],
  },
];

export function etiquetaRol(valor) {
  return ROLES.find((r) => r.valor === valor)?.etiqueta ?? valor;
}

// Las fechas de los eventos se guardan en UTC; se muestran en UTC para no correr el día.
export function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString('es-CL', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatearFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function estadoTrabajador(t) {
  if (t.bloqueado) return { texto: 'Bloqueado', clase: 'cancelled' };
  if (!t.activo) return { texto: 'Inactivo', clase: 'pending' };
  return { texto: 'Activo', clase: 'confirmed' };
}
