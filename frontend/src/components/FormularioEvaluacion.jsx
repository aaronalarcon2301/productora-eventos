import { useState } from 'react';
import { apiFetch } from '../api/apiFetch';
import { GRUPOS_EVALUACION, ROLES_TECNICOS, NOTAS_CON_COMENTARIO, etiquetaRol } from './personalConstantes';

// Sirve para crear (POST) y para editar (PUT) una evaluación.
// Si recibe `evaluacion`, entra en modo edición con los valores cargados.
function FormularioEvaluacion({ trabajadorId, trabajadorNombre, eventoId, eventoNombre, rolEvento, evaluacion, onGuardado, onCancelar }) {
  const esEdicion = Boolean(evaluacion);
  const esTecnico = ROLES_TECNICOS.includes(rolEvento);
  const grupos = GRUPOS_EVALUACION.filter((g) => !g.soloTecnico || esTecnico);
  const criterios = grupos.flatMap((g) => g.criterios);

  const [notas, setNotas] = useState(() =>
    Object.fromEntries(criterios.map((c) => [c.campo, evaluacion?.[c.campo] ?? null]))
  );
  const [comentarios, setComentarios] = useState(() =>
    Object.fromEntries(criterios.map((c) => [c.comentario, evaluacion?.[c.comentario] ?? '']))
  );
  const [abiertos, setAbiertos] = useState({});
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const requiereComentario = (campo) => NOTAS_CON_COMENTARIO.includes(notas[campo]);

  const validar = () => {
    const problemas = [];
    for (const c of criterios) {
      if (!notas[c.campo]) {
        problemas.push(`Falta calificar "${c.etiqueta}".`);
      } else if (requiereComentario(c.campo) && !comentarios[c.comentario].trim()) {
        problemas.push(`Justifica con un comentario la nota ${notas[c.campo]} de "${c.etiqueta}".`);
      }
    }
    return problemas;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problemas = validar();
    if (problemas.length > 0) {
      setErrores(problemas);
      return;
    }

    const payload = { trabajadorId: Number(trabajadorId), eventoId: Number(eventoId), rolEvento };
    for (const c of criterios) {
      payload[c.campo] = notas[c.campo];
      if (comentarios[c.comentario].trim()) payload[c.comentario] = comentarios[c.comentario].trim();
    }
    if (esEdicion && motivo.trim()) payload.motivo = motivo.trim();

    setErrores([]);
    setGuardando(true);
    try {
      const resultado = esEdicion
        ? await apiFetch(`/evaluaciones/${evaluacion.id}`, { method: 'PUT', body: payload })
        : await apiFetch('/evaluaciones', { method: 'POST', body: payload });
      onGuardado(resultado);
    } catch (err) {
      setErrores([err.message]);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="panel">
      <h2>
        {esEdicion ? 'Editar evaluación' : 'Nueva evaluación'}
        {trabajadorNombre && ` · ${trabajadorNombre}`}
      </h2>
      <p className="meta" style={{ color: 'var(--ink-dim)', marginTop: 0 }}>
        {eventoNombre} · {etiquetaRol(rolEvento)}. Escala de 1 a 5; las notas 1, 2 y 5 requieren un comentario.
        {esTecnico && ' Al ser un rol técnico, también se evalúa el manejo de equipos.'}
      </p>

      <form onSubmit={handleSubmit}>
        {errores.length > 0 && (
          <div className="pers-alert error">
            <ul>
              {errores.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {grupos.map((g) => (
          <div key={g.id} className="grupo-eval">
            <h4>{g.titulo}</h4>
            {g.criterios.map((c) => {
              const mostrarComentario = requiereComentario(c.campo) || comentarios[c.comentario] || abiertos[c.campo];
              return (
                <div key={c.campo} className="criterio">
                  <div className="etiqueta">
                    <span>{c.etiqueta}</span>
                    <div className="nota-selector" role="group" aria-label={c.etiqueta}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          type="button"
                          key={n}
                          className={`nota-btn ${notas[c.campo] === n ? 'activa' : ''}`}
                          onClick={() => setNotas({ ...notas, [c.campo]: n })}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {mostrarComentario ? (
                    <textarea
                      rows={2}
                      value={comentarios[c.comentario]}
                      onChange={(e) => setComentarios({ ...comentarios, [c.comentario]: e.target.value })}
                      placeholder={
                        requiereComentario(c.campo) ? 'Comentario obligatorio para las notas 1, 2 y 5' : 'Comentario (opcional)'
                      }
                    />
                  ) : (
                    notas[c.campo] && (
                      <button type="button" className="link-btn" onClick={() => setAbiertos({ ...abiertos, [c.campo]: true })}>
                        + Agregar comentario
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {esEdicion && (
          <div className="campo">
            <label>Motivo del cambio (opcional, queda en la bitácora)</label>
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Corrección de una nota mal ingresada" />
          </div>
        )}

        <div className="acciones">
          <button type="submit" className="btn" disabled={guardando}>
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Guardar evaluación'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default FormularioEvaluacion;
