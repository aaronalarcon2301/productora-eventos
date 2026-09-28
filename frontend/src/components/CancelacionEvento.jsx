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

  const cajaStyle = { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginTop: '15px' };

  return (
    <div style={cajaStyle}>
      <h4 style={{ marginTop: 0 }}>Gestión de abono y cancelación</h4>

      {evento.cancelado && !comprobante && (
        <p>
          <strong style={{ color: '#b00020' }}>EVENTO CANCELADO</strong> el {formatoFecha(evento.fechaCancelacion)}.
          Monto a devolver: <strong>{formatoPesos(evento.montoDevolucion ?? 0)}</strong>
        </p>
      )}

      {!evento.cancelado && !evento.confirmado && (
        <form onSubmit={registrarAbono}>
          <p>Aún no hay abono registrado. Al registrarlo, el evento queda confirmado y la fecha se bloquea.</p>
          <label>
            Fecha del pago:{' '}
            <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} required />
          </label>
          <br />
          <label>
            Monto del abono (50% del presupuesto):{' '}
            <input type="number" value={montoAbono} onChange={(e) => setMontoAbono(e.target.value)} required min="1" />
          </label>
          <br />
          <button type="submit" style={{ marginTop: '10px', padding: '6px 14px' }}>Registrar abono</button>
        </form>
      )}

      {!evento.cancelado && evento.confirmado && (
        <div>
          <p>
            Abono de <strong>{formatoPesos(evento.montoAbono)}</strong> pagado el {formatoFecha(evento.fechaPago)}.
          </p>
          <label>
            Fecha de la solicitud de cancelación:{' '}
            <input type="date" value={fechaSolicitud} onChange={(e) => setFechaSolicitud(e.target.value)} />
          </label>
          <br />
          <button
            onClick={cancelarEvento}
            style={{ marginTop: '10px', padding: '6px 14px', background: '#b00020', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancelar evento y calcular devolución
          </button>
        </div>
      )}

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      {comprobante && (
        <div style={{ ...cajaStyle, background: '#fafafa' }} id="comprobante">
          <h4 style={{ marginTop: 0 }}>🧾 Comprobante de devolución N° {comprobante.numeroComprobante}</h4>
          <p style={{ lineHeight: 1.7 }}>
            Evento: {comprobante.evento}<br />
            Cliente: {comprobante.cliente}<br />
            Lugar: {comprobante.lugar}<br />
            Fecha del pago: {formatoFecha(comprobante.fechaPago)}<br />
            Fecha de la solicitud: {formatoFecha(comprobante.fechaCancelacion)}<br />
            Días hábiles transcurridos: {comprobante.diasHabilesTranscurridos}<br />
            Porcentaje de devolución: {comprobante.porcentajeDevolucion}%<br />
            Abono pagado: {formatoPesos(comprobante.montoAbono)}<br />
            <strong>Monto a devolver: {formatoPesos(comprobante.montoDevolucion)}</strong>
          </p>
          <button onClick={() => window.print()} style={{ padding: '6px 14px' }}>Imprimir comprobante</button>
        </div>
      )}
    </div>
  );
}

export default CancelacionEvento;
