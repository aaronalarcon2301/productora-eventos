import { useEffect, useState } from 'react';
import { apiFetch } from '../api/apiFetch';

const estados = {
  PENDIENTE: 'En revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado'
};

const clases = {
  PENDIENTE: 'pending',
  APROBADO: 'confirmed',
  RECHAZADO: 'cancelled'
};

export default function MisSolicitudes({ setVista }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    try {
      setError('');
      const datos = await apiFetch('/eventos/mis-solicitudes');
      setSolicitudes(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <section className="panel">
      <header className="page-heading">
        <div>
          <h1>Mis solicitudes</h1>
          <p>Consulta el estado de tus presupuestos.</p>
        </div>

        <button className="btn btn-ghost" onClick={cargar}>
          Actualizar
        </button>
      </header>

      {error && <p className="notice notice-error">{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : solicitudes.length === 0 ? (
        <div>
          <p>No tienes solicitudes registradas.</p>
          <button
            className="btn"
            onClick={() => setVista('eventos')}
          >
            Solicitar un evento
          </button>
        </div>
      ) : (
        <ul className="lista-simple">
          {solicitudes.map(evento => (
            <li key={evento.id} className="solicitud-item">
              <div>
                <strong>{evento.nombre}</strong>
                <p>
                  Presupuesto: $
                  {Number(evento.presupuesto || 0)
                    .toLocaleString('es-CL')}
                </p>
              </div>

              <span className={`status ${clases[evento.estadoPresupuesto]}`}>
                {estados[evento.estadoPresupuesto]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}