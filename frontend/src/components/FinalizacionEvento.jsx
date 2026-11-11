import { useState } from 'react';
import { apiFetch } from '../api/apiFetch';
import './finalizacion.css';

const formatoFecha = (f) => new Date(f).toLocaleDateString('es-CL', { timeZone: 'UTC' });

function textoPendientes({ trabajadoresSinEvaluar, equiposPendientes }) {
  const partes = [];
  if (trabajadoresSinEvaluar > 0) partes.push(`evaluar a ${trabajadoresSinEvaluar} trabajador(es)`);
  if (equiposPendientes > 0) partes.push(`cerrar la devolución de ${equiposPendientes} equipo(s)`);
  return partes.length > 0 ? `Queda pendiente: ${partes.join(' y ')}.` : 'No quedan evaluaciones ni equipos pendientes.';
}

function FinalizacionEvento({ evento, onActualizado }) {
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [procesando, setProcesando] = useState(false);

  if (evento.cancelado) return null;

  const ejecutar = async (accion) => {
    setError(null);
    setResultado(null);
    setProcesando(true);
    try {
      const data = await apiFetch(`/eventos/${evento.id}/${accion}`, { method: 'POST' });
      onActualizado({ ...evento, ...data.evento });
      if (accion === 'finalizar') setResultado(textoPendientes(data.pendientes));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const finalizar = () => {
    const confirmado = window.confirm(
      `¿Marcar "${evento.nombre}" como finalizado?\n\nPodrás evaluar al personal y registrar la devolución de equipos. ` +
        'Mientras no tenga evaluaciones, puedes reabrirlo.'
    );
    if (confirmado) ejecutar('finalizar');
  };

  const manual = Boolean(evento.finalizadoAt);

  return (
    <div className="finalizacion">
      <h3>Finalización del evento</h3>
      {error && <div className="fin-alert error">{error}</div>}
      {resultado && <div className="fin-alert ok">Evento finalizado. {resultado}</div>}

      {evento.finalizado ? (
        <>
          <p className="texto">
            <span className="status finalizado">FINALIZADO</span>{' '}
            {manual
              ? `Se marcó como finalizado el ${formatoFecha(evento.finalizadoAt)}.`
              : 'Finalizó automáticamente porque ya pasó la fecha del evento.'}
          </p>
          {manual && (
            <button className="btn btn-ghost" disabled={procesando} onClick={() => ejecutar('reabrir')}>
              Reabrir evento
            </button>
          )}
        </>
      ) : (
        <>
          <p className="texto">
            Cuando el evento termine, márcalo como finalizado para evaluar al personal y registrar la devolución de los equipos.
            También se finaliza solo cuando pasa su fecha.
          </p>
          <button className="btn" disabled={procesando} onClick={finalizar}>
            Finalizar evento
          </button>
        </>
      )}
    </div>
  );
}

export default FinalizacionEvento;
