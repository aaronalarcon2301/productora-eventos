import { useState, useEffect } from 'react';
import './personal.css';
import { apiFetch } from '../api/apiFetch';
import { GRUPOS_EVALUACION, etiquetaRol, formatearFecha } from './personalConstantes';

function TarjetaEvaluacion({ ev }) {
  const grupos = GRUPOS_EVALUACION.filter((g) => ev[g.promedio] != null);

  return (
    <div className="tarjeta-eval">
      <div className="cabecera">
        <div>
          <div className="principal" style={{ fontWeight: 600 }}>{ev.evento.nombre}</div>
          <div className="meta" style={{ color: 'var(--ink-dim)', fontSize: 13 }}>
            {formatearFecha(ev.evento.fecha)} · {etiquetaRol(ev.rolEvento)}
          </div>
        </div>
      </div>

      <div className="promedios">
        {grupos.map((g) => (
          <span key={g.id}>
            {g.titulo}: <strong>{ev[g.promedio].toFixed(1)}</strong>
          </span>
        ))}
        <span>
          Promedio: <strong>{ev.promedioEvaluacion.toFixed(1)}</strong>
        </span>
      </div>

      <details>
        <summary>Ver detalle por criterio</summary>
        <ul className="detalle">
          {grupos.flatMap((g) =>
            g.criterios.map((c) => (
              <li key={c.campo}>
                {c.etiqueta}: <strong>{ev[c.campo]}</strong>
                {ev[c.comentario] && <div className="comentario">“{ev[c.comentario]}”</div>}
              </li>
            ))
          )}
        </ul>
      </details>
    </div>
  );
}

function MisEvaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    apiFetch('/mi-perfil/evaluaciones')
      .then((datos) => {
        if (!activo) return;
        setEvaluaciones(datos);
        setCargando(false);
      })
      .catch((err) => {
        if (!activo) return;
        setError(err.message);
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const promedio = evaluaciones.length
    ? (evaluaciones.reduce((s, e) => s + e.promedioEvaluacion, 0) / evaluaciones.length).toFixed(1)
    : '—';

  return (
    <section className="pagina">
      <header className="pagina-cab">
        <h1>Mis evaluaciones</h1>
        <p>Cómo te evaluaron en los eventos en que trabajaste.</p>
      </header>

      {error && <div className="pers-alert error">{error}</div>}

      <div className="stats">
        <div className="stat destacado">
          <span>Promedio general</span>
          <strong>{promedio}</strong>
        </div>
        <div className="stat">
          <span>Evaluaciones</span>
          <strong>{evaluaciones.length}</strong>
        </div>
      </div>

      <div className="panel">
        {cargando ? (
          <p className="pers-vacio">Cargando…</p>
        ) : evaluaciones.length === 0 ? (
          <p className="pers-vacio">Aún no tienes evaluaciones registradas.</p>
        ) : (
          evaluaciones.map((ev) => <TarjetaEvaluacion key={ev.id} ev={ev} />)
        )}
      </div>
    </section>
  );
}

export default MisEvaluaciones;
