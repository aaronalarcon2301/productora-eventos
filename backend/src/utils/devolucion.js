
const DIA_MS = 24 * 60 * 60 * 1000;

function inicioDiaUTC(valor) {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    throw new RangeError(
      'Fecha inválida para calcular días hábiles.'
    );
  }

  return Date.UTC(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth(),
    fecha.getUTCDate()
  );
}

export function contarDiasHabiles(
  fechaInicio,
  fechaFin,
  feriados = []
) {
  const inicio = inicioDiaUTC(fechaInicio);
  const fin = inicioDiaUTC(fechaFin);

  if (fin < inicio) {
    throw new RangeError(
      'La fecha de solicitud es anterior a la fecha del pago.'
    );
  }

  const diasFeriados = new Set(feriados);
  let contador = 0;

  for (let ms = inicio + DIA_MS; ms <= fin; ms += DIA_MS) {
    const fecha = new Date(ms);
    const diaSemana = fecha.getUTCDay();
    const iso = fecha.toISOString().slice(0, 10);

    const finDeSemana =
      diaSemana === 0 || diaSemana === 6;

    if (!finDeSemana && !diasFeriados.has(iso)) {
      contador++;
    }
  }

  return contador;
}

export function buscarTramo(diasHabiles, politicas) {
  const coincidentes = politicas.filter(tramo =>
    diasHabiles >= tramo.diasDesde &&
    (
      tramo.diasHasta === null ||
      diasHabiles <= tramo.diasHasta
    )
  );

  if (coincidentes.length !== 1) {
    throw new RangeError(
      `No hay un único tramo válido para ${diasHabiles} días hábiles. Revisa las políticas de devolución.`
    );
  }

  const tramo = coincidentes[0];

  if (
    !Number.isInteger(tramo.porcentaje) ||
    tramo.porcentaje < 0 ||
    tramo.porcentaje > 100
  ) {
    throw new RangeError(
      'El porcentaje de devolución configurado no es válido.'
    );
  }

  return tramo;
}

export function hoyChile(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(fecha);

  const valor = tipo =>
    partes.find(parte => parte.type === tipo).value;

  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}
