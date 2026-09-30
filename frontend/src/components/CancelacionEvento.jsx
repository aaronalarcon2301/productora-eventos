import { useState } from 'react';
import { API_URL } from '../api/config';

const formatoPesos = (n) => `$${Number(n).toLocaleString('es-CL')}`;
const formatoFecha = (f) => new Date(f).toLocaleDateString('es-CL', { timeZone: 'UTC' });
const hoy = () => new Date().toISOString().slice(0, 10);

// Panel del usuario administrativo para un evento:
//  - Si aún no tiene abono  -> permite registrarlo (lo deja "confirmado")
//  - Si está confirmado     -> permite cancelarlo y ver el comprobante de devolución
//  - Si está cancelado      -> muestra el resultado
function CancelacionEvento({ evento, onActualizado }) {
  const [fechaPago, setFechaPago] = useState(hoy());
  const [montoAbono, setMontoAbono] = useState(
    evento.presupuesto ? Math.round(evento.presupuesto * 0.5) : ''
  );
  const [fechaSolicitud, setFechaSolicitud] = useState(hoy());
  const [comprobante, setComprobante] = useState(null);
  const [error, setError] = useState(null);

  const leerError = (data) =>
    data.detalles ? data.detalles.map((d) => `${d.campo}: ${d.mensaje}`).join(' | ') : data.error;

  const registrarAbono = async (e) => {
    e.preventDefault();
    setError(null);

    const res = await fetch(`${API_URL}/eventos/${evento.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmado: true, fechaPago, montoAbono: Number(montoAbono) }),
    });
    const data = await res.json();

    if (!res.ok) return setError(leerError(data));
    onActualizado({ ...evento, ...data });
  };

  const cancelarEvento = async () => {
    setError(null);

    const res = await fetch(`${API_URL}/eventos/${evento.id}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fechaSolicitud }),
    });
    const data = await res.json();

    if (!res.ok) return setError(leerError(data));
    setComprobante(data.comprobante);
    onActualizado(data.evento);
  };

  return (
    <div className="panel-inset">
      <h3 style={{ marginTop: 0 }}>Gestión de abono y cancelación</h3>

      {evento.cancelado && !comprobante && (
        <p>
          <span className="status cancelled"><span className="dot" />Evento cancelado</span> el{' '}
          {formatoFecha(evento.fechaCancelacion)}. Monto a devolver:{' '}
          <strong>{formatoPesos(evento.montoDevolucion ?? 0)}</strong>
        </p>
      )}

      {!evento.cancelado && !evento.confirmado && (
        <form onSubmit={registrarAbono}>
          <p className="empty" style={{ padding: 0, marginBottom: 12 }}>
            Aún no hay abono registrado. Al registrarlo, el evento queda confirmado y la fecha se bloquea.
          </p>

          <div className="field">
            <label htmlFor="fecha-pago">Fecha del pago</label>
            <input
              id="fecha-pago"
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="monto-abono">Monto del abono (50% del presupuesto)</label>
            <input
              id="monto-abono"
              type="number"
              value={montoAbono}
              onChange={(e) => setMontoAbono(e.target.value)}
              required
              min="1"
            />
          </div>

          <button type="submit" className="btn btn-primary">Registrar abono</button>
        </form>
      )}

      {!evento.cancelado && evento.confirmado && (
        <div>
          <p style={{ marginBottom: 14 }}>
            Abono de <strong>{formatoPesos(evento.montoAbono)}</strong> pagado el {formatoFecha(evento.fechaPago)}.
          </p>

          <div className="field">
            <label htmlFor="fecha-solicitud">Fecha de la solicitud de cancelación</label>
            <input
              id="fecha-solicitud"
              type="date"
              value={fechaSolicitud}
              onChange={(e) => setFechaSolicitud(e.target.value)}
            />
          </div>

          <button type="button" onClick={cancelarEvento} className="btn btn-danger">
            Cancelar evento y calcular devolución
          </button>
        </div>
      )}

      {error && <p className="alert alert-error" style={{ marginTop: 14 }}>{error}</p>}

      {comprobante && (
        <div className="panel receipt" style={{ marginTop: 16, marginBottom: 0 }} id="comprobante">
          <h3 style={{ marginTop: 0 }}>Comprobante de devolución N.º {comprobante.numeroComprobante}</h3>
          <dl>
            <dt>Evento</dt><dd>{comprobante.evento}</dd>
            <dt>Cliente</dt><dd>{comprobante.cliente}</dd>
            <dt>Lugar</dt><dd>{comprobante.lugar}</dd>
            <dt>Fecha del pago</dt><dd>{formatoFecha(comprobante.fechaPago)}</dd>
            <dt>Fecha de la solicitud</dt><dd>{formatoFecha(comprobante.fechaCancelacion)}</dd>
            <dt>Días hábiles transcurridos</dt><dd>{comprobante.diasHabilesTranscurridos}</dd>
            <dt>Porcentaje de devolución</dt><dd>{comprobante.porcentajeDevolucion}%</dd>
            <dt>Abono pagado</dt><dd>{formatoPesos(comprobante.montoAbono)}</dd>
          </dl>
          <div className="total">
            <span>Monto a devolver</span>
            <span>{formatoPesos(comprobante.montoDevolucion)}</span>
          </div>
          <button type="button" onClick={() => window.print()} className="btn btn-ghost" style={{ marginTop: 16 }}>
            Imprimir comprobante
          </button>
        </div>
      )}
    </div>
  );
}

export default CancelacionEvento;