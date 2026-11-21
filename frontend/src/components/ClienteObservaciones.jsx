
import { useEffect, useState } from 'react';
import { apiFetch } from '../api/apiFetch';

export default function ClienteObservaciones({ clienteId }) {
  const [observaciones, setObservaciones] = useState('');
  const [original, setOriginal] = useState('');
  const [puedeEditar, setPuedeEditar] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;

    if (!clienteId) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setError('');
    setMensaje('');
    setObservaciones('');
    setOriginal('');

    apiFetch(`/clientes-observaciones/${clienteId}`)
      .then(cliente => {
        if (!activo) return;

        const texto = cliente.observaciones || '';

        setObservaciones(texto);
        setOriginal(texto);
        setPuedeEditar(cliente.puedeEditar === true);
      })
      .catch(err => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [clienteId]);

  const guardar = async (e) => {
    e.preventDefault();

    const texto = observaciones.trim();

    if (texto.length > 2000) {
      setError('El máximo es de 2000 caracteres.');
      return;
    }

    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      const cliente = await apiFetch(
        `/clientes-observaciones/${clienteId}`,
        {
          method: 'PATCH',
          body: {
            observaciones: texto || null
          }
        }
      );

      const guardado = cliente.observaciones || '';

      setObservaciones(guardado);
      setOriginal(guardado);

      setMensaje('Observaciones guardadas correctamente.');

    } catch (err) {
      setError(err.message);

    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="panel" style={{ marginTop: 20 }}>
      <h3>Observaciones del cliente</h3>

      <p className="helper-text">
        Preferencias, indicaciones y antecedentes útiles
        para la organización de futuros eventos.
      </p>

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      {mensaje && (
        <p className="notice notice-ok">
          {mensaje}
        </p>
      )}

      {cargando ? (
        <p>Cargando observaciones...</p>
      ) : (
        <form onSubmit={guardar} className="login-form">
          <label htmlFor={`observaciones-${clienteId}`}>
            Notas internas
          </label>

          <textarea
            id={`observaciones-${clienteId}`}
            rows={5}
            maxLength={2000}
            value={observaciones}
            onChange={e => {
              setObservaciones(e.target.value);
              setMensaje('');
            }}
            placeholder="Ej: Prefiere eventos nocturnos. Solicita confirmar los equipos con anticipación."
            readOnly={!puedeEditar}
            style={{ width: '100%', resize: 'vertical' }}
          />

          <p className="helper-text">
            {observaciones.length}/2000 caracteres
          </p>

          {puedeEditar ? (
            <div className="presupuesto-actions">
              <button
                type="submit"
                className="btn"
                disabled={
                  guardando ||
                  observaciones === original
                }
              >
                {guardando
                  ? 'Guardando...'
                  : 'Guardar observaciones'}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                disabled={guardando}
                onClick={() => {
                  setObservaciones(original);
                  setError('');
                  setMensaje('');
                }}
              >
                Descartar cambios
              </button>
            </div>
          ) : (
            <p className="helper-text">
              Solo el gerente puede modificar estas observaciones.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
