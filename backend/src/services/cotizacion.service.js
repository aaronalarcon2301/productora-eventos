import prisma from '../config/prisma.js';

export const calcularCotizacion = async ({ fecha, duracionHoras, numInvitados }) => {
  const config = await prisma.configuracionPrecio.findFirst();
  if (!config) {
    const error = new Error('No hay una configuración de precios registrada (falta la fila en ConfiguracionPrecio)');
    error.status = 500;
    throw error;
  }

  // 1) Temporada: revisa si la fecha cae dentro de algún rango de temporada alta
  const temporadas = await prisma.temporadaAlta.findMany();
  const temporadaAplicable = temporadas.find(
    (t) => fecha >= t.fechaInicio && fecha <= t.fechaFin
  );
  const recargoTemporada = temporadaAplicable ? temporadaAplicable.recargo : 1;

  // 2) Día de semana: sábado (6) o domingo (0) cuenta como fin de semana
  const diaSemana = fecha.getDay();
  const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
  const recargoFinDeSemana = esFinDeSemana ? config.recargoFinDeSemana : 1;

  // 3) Horario: diurno vs nocturno, según la hora de inicio del evento
  const hora = fecha.getHours();
  const esNocturno = hora >= config.horaInicioNocturno;
  const recargoNocturno = esNocturno ? config.recargoNocturno : 1;

  // 4) Precio por hora ya con todos los recargos aplicados, multiplicado por la duración
  const precioPorHora = config.precioBaseHora * recargoTemporada * recargoFinDeSemana * recargoNocturno;
  const subtotalPorHoras = precioPorHora * duracionHoras;

  // 5) Invitados por sobre el umbral base pagan un extra fijo por cabeza
  const invitadosExtra = Math.max(0, numInvitados - config.invitadosBase);
  const costoInvitadosExtra = invitadosExtra * config.precioPorInvitadoExtra;

  const presupuestoTotal = Math.round(subtotalPorHoras + costoInvitadosExtra);
  const montoAbono = Math.round(presupuestoTotal * 0.5); // 50% de abono, según la encuesta (Q4)

  return {
    detalle: {
      precioBaseHora: config.precioBaseHora,
      temporadaAplicada: temporadaAplicable?.nombre ?? 'Temporada baja (sin recargo)',
      recargoTemporada,
      esFinDeSemana,
      recargoFinDeSemana,
      esNocturno,
      recargoNocturno,
      duracionHoras,
      subtotalPorHoras: Math.round(subtotalPorHoras),
      invitadosBaseIncluidos: config.invitadosBase,
      invitadosExtra,
      costoInvitadosExtra,
    },
    presupuestoTotal,
    montoAbono,
  };
};