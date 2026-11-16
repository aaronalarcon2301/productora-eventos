import { useEffect, useState } from 'react';
import { apiFetch } from '../api/apiFetch';

const pesos = (n) =>
  `$${Number(n || 0).toLocaleString('es-CL')}`;

const fecha = (f) =>
  new Date(f).toLocaleDateString('es-CL', {
    timeZone: 'UTC'
  });

export default function AprobacionPresupuestos() {
  const [pendientes, setPendientes] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [procesando, setProcesando] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setError('');

    try {
      const datos = await apiFetch('/eventos/pendientes');
      setPendientes(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const decidir = async (evento, decision) => {
    const accion = decision === 'APROBADO'
      ? 'aprobar'
      : 'rechazar';

    if (!window.confirm(
      `¿Deseas ${accion} el presupuesto de "${evento.nombre}"?`
    )) return;

    setProcesando(evento.id);
    setError('');
    setMensaje('');

    try {
      await apiFetch(`/eventos/${evento.id}/presupuesto`, {
        method: 'PATCH',
        body: { decision }
      });

      setPendientes(anteriores =>
        anteriores.filter(item => item.id !== evento.id)
      );

      setMensaje(
        `Presupuesto ${decision === 'APROBADO'
          ? 'aprobado'
          : 'rechazado'} correctamente.`
      );

    } catch (err) {
      setError(err.message);
      await cargar();
    } finally {
      setProcesando(null);
    }
  };

  return (
    <section>
      <header className="page-heading">
        <div>
          <h1>Aprobación de presupuestos</h1>
          <p>Solicitudes que requieren revisión del gerente.</p>
        </div>

        <button className="btn btn-ghost" onClick={cargar}>
          Actualizar
        </button>
      </header>

      {mensaje && (
        <p className="notice notice-ok">{mensaje}</p>
      )}

      {error && (
        <p className="notice notice-error">{error}</p>
      )}

      {cargando ? (
        <p>Cargando presupuestos...</p>
      ) : pendientes.length === 0 ? (
        <div className="panel">
          <h2>No hay presupuestos pendientes</h2>
          <p>Las nuevas solicitudes aparecerán aquí.</p>
        </div>
      ) : (
        <div className="presupuesto-grid">
          {pendientes.map(evento => (
            <article
              className="panel presupuesto-card"
              key={evento.id}
            >
              <div className="presupuesto-heading">
                <h2>{evento.nombre}</h2>
                <span className="status pending">PENDIENTE</span>
              </div>

              <p>
                <strong>Cliente:</strong> {evento.cliente?.nombre}
              </p>

              <p>
                <strong>Lugar:</strong> {evento.lugar?.nombre}
              </p>

              <p>
                <strong>Fecha:</strong> {fecha(evento.fecha)}
              </p>

              <p>
                <strong>Invitados:</strong> {evento.numInvitados}
              </p>

              <p>
                <strong>Solicitado por:</strong>{' '}
                {evento.creadoPor?.nombre || 'Registro anterior'}
              </p>

              <div className="presupuesto-total">
                {pesos(evento.presupuesto)}
              </div>

              <div className="presupuesto-actions">
                <button
                  className="btn"
                  disabled={procesando !== null}
                  onClick={() => decidir(evento, 'APROBADO')}
                >
                  Aprobar presupuesto
                </button>

                <button
                  className="btn btn-danger"
                  disabled={procesando !== null}
                  onClick={() => decidir(evento, 'RECHAZADO')}
                >
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}