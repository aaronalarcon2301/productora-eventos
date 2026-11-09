import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import FormularioEvaluacion from './FormularioEvaluacion';
import { etiquetaRol, formatearFecha } from './personalConstantes';

function estadoAsignacion(a) {
  if (a.evaluada) return { texto: 'Evaluado', clase: 'confirmed' };
  if (a.evento.cancelado) return { texto: 'Evento cancelado', clase: 'cancelled' };
  if (!a.finalizado) return { texto: 'Aún no finaliza', clase: 'pending' };
  return { texto: 'Pendiente de evaluar', clase: 'pending' };
}

function EvaluacionTrabajador({ trabajadorId, setTrabajadorId, onVerHistorial }) {
  const [trabajadores, setTrabajadores] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [evaluando, setEvaluando] = useState(null); // asignación que se está evaluando
  const [aviso, setAviso] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    apiFetch('/trabajadores')
      .then((datos) => activo && setTrabajadores(datos))
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!trabajadorId) return;
    let activo = true;
    apiFetch(`/asignaciones/trabajador/${trabajadorId}`)
      .then((datos) => activo && setAsignaciones(datos))
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, [trabajadorId, version]);

  const trabajador = trabajadores.find((t) => String(t.id) === String(trabajadorId));
  const lista = trabajadorId ? asignaciones : [];

  const handleGuardado = () => {
    setEvaluando(null);
    setAviso({ tipo: 'ok', texto: 'Evaluación registrada. El historial y los promedios se actualizaron.' });
    setVersion((v) => v + 1);
  };

  if (evaluando) {
    return (
      <FormularioEvaluacion
        trabajadorId={trabajadorId}
        trabajadorNombre={trabajador?.nombre}
        eventoId={evaluando.eventoId}
        eventoNombre={evaluando.evento.nombre}
        rolEvento={evaluando.rol}
        onGuardado={handleGuardado}
        onCancelar={() => setEvaluando(null)}
      />
    );
  }

  return (
    <section className="panel">
      <h2>Evaluación de personal</h2>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="campo">
        <label>Trabajador</label>
        <select
          value={trabajadorId}
          onChange={(e) => {
            setTrabajadorId(e.target.value);
            setAviso(null);
          }}
        >
          <option value="">Selecciona un trabajador…</option>
          {trabajadores.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} — {etiquetaRol(t.rolPrincipal)}
              {t.bloqueado ? ' (bloqueado)' : ''}
            </option>
          ))}
        </select>
      </div>

      {trabajador?.bloqueado && (
        <div className="pers-alert error">
          Este trabajador está bloqueado por una falta grave y no puede recibir nuevas evaluaciones.
        </div>
      )}

      {trabajadorId && (
        <>
          <h3 className="seccion-titulo">Eventos en los que participó</h3>
          {lista.length === 0 ? (
            <p className="pers-vacio">
              Este trabajador no tiene eventos asignados. Asígnalo primero desde la pestaña “Asignaciones”.
            </p>
          ) : (
            lista.map((a) => {
              const estado = estadoAsignacion(a);
              const puedeEvaluar = !a.evaluada && a.finalizado && !a.evento.cancelado && !trabajador?.bloqueado;
              return (
                <div key={a.id} className="fila-personal">
                  <div>
                    <div className="principal">{a.evento.nombre}</div>
                    <div className="meta">
                      {formatearFecha(a.evento.fecha)} · {etiquetaRol(a.rol)}
                    </div>
                    <div className="insignias">
                      <span className={`status ${estado.clase}`}>{estado.texto}</span>
                    </div>
                  </div>
                  <div className="acciones">
                    {a.evaluada ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => onVerHistorial(trabajadorId)}>
                        Ver en historial
                      </button>
                    ) : (
                      <button className="btn btn-sm" disabled={!puedeEvaluar} onClick={() => { setAviso(null); setEvaluando(a); }}>
                        Evaluar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}
    </section>
  );
}

export default EvaluacionTrabajador;
