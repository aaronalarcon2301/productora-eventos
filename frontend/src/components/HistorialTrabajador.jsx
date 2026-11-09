import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import FormularioEvaluacion from './FormularioEvaluacion';
import {
  GRUPOS_EVALUACION,
  etiquetaRol,
  formatearFecha,
  formatearFechaHora,
  estadoTrabajador,
} from './personalConstantes';

function TarjetaEvaluacion({ evaluacion: ev, onEditar, onEliminada, onError }) {
  const [eliminando, setEliminando] = useState(false);
  const [motivo, setMotivo] = useState('');

  const confirmarEliminacion = async () => {
    if (!motivo.trim()) {
      onError('Debes indicar el motivo de la eliminación.');
      return;
    }
    try {
      await apiFetch(`/evaluaciones/${ev.id}`, { method: 'DELETE', body: { motivo: motivo.trim() } });
      onEliminada();
    } catch (err) {
      onError(err.message);
    }
  };

  const grupos = GRUPOS_EVALUACION.filter((g) => ev[g.promedio] != null);

  return (
    <div className="tarjeta-eval">
      <div className="cabecera">
        <div>
          <div className="principal" style={{ fontWeight: 600 }}>{ev.evento?.nombre ?? `Evento #${ev.eventoId}`}</div>
          <div className="meta" style={{ color: 'var(--ink-dim)', fontSize: 13 }}>
            {ev.evento && `${formatearFecha(ev.evento.fecha)} · `}
            {etiquetaRol(ev.rolEvento)}
          </div>
        </div>
        <div className="acciones">
          <button className="btn btn-ghost btn-sm" onClick={onEditar}>Editar</button>
          <button className="btn btn-danger btn-sm" onClick={() => setEliminando(true)}>Eliminar</button>
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

      {ev.modificadoPorId != null && (
        <div className="meta" style={{ color: 'var(--ink-dim)', fontSize: 12 }}>
          Última modificación por administrador #{ev.modificadoPorId} · {formatearFechaHora(ev.updatedAt)}
        </div>
      )}

      {eliminando && (
        <div className="caja-eliminar">
          <div className="campo">
            <label>Motivo de la eliminación (obligatorio)</label>
            <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Evaluación duplicada o ingresada por error" />
          </div>
          <div className="acciones">
            <button className="btn btn-danger btn-sm" onClick={confirmarEliminacion}>Confirmar eliminación</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setEliminando(false); setMotivo(''); }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormularioIncidente({ trabajadorId, asignaciones, onRegistrado, onError }) {
  const [form, setForm] = useState({ tipo: 'INASISTENCIA', eventoId: '', motivo: '' });
  const esFaltaGrave = form.tipo === 'FALTA_GRAVE';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (esFaltaGrave && !window.confirm('Una falta grave bloquea al trabajador de forma inmediata y no podrá ser asignado a nuevos eventos. ¿Continuar?')) {
      return;
    }
    try {
      await apiFetch('/incidentes', {
        method: 'POST',
        body: {
          trabajadorId: Number(trabajadorId),
          tipo: form.tipo,
          ...(form.eventoId ? { eventoId: Number(form.eventoId) } : {}),
          ...(form.motivo.trim() ? { motivo: form.motivo.trim() } : {}),
        },
      });
      setForm({ tipo: 'INASISTENCIA', eventoId: '', motivo: '' });
      onRegistrado();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid-2">
        <div className="campo">
          <label>Tipo de incidente</label>
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="INASISTENCIA">Inasistencia</option>
            <option value="FALTA_GRAVE">Falta grave (bloquea al trabajador)</option>
          </select>
        </div>
        <div className="campo">
          <label>Evento (opcional)</label>
          <select value={form.eventoId} onChange={(e) => setForm({ ...form, eventoId: e.target.value })}>
            <option value="">Sin evento asociado</option>
            {asignaciones.map((a) => (
              <option key={a.eventoId} value={a.eventoId}>{a.evento.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="campo">
        <label>Motivo {esFaltaGrave ? '(obligatorio)' : '(opcional)'}</label>
        <textarea rows={2} required={esFaltaGrave} value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
      </div>
      <button type="submit" className={`btn btn-sm ${esFaltaGrave ? 'btn-danger' : ''}`}>Registrar incidente</button>
    </form>
  );
}

function HistorialTrabajador({ trabajadorId, setTrabajadorId }) {
  const [trabajadores, setTrabajadores] = useState([]);
  const [historial, setHistorial] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
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
    Promise.all([apiFetch(`/trabajadores/${trabajadorId}/historial`), apiFetch(`/asignaciones/trabajador/${trabajadorId}`)])
      .then(([datosHistorial, datosAsignaciones]) => {
        if (!activo) return;
        setHistorial(datosHistorial);
        setAsignaciones(datosAsignaciones);
      })
      .catch((err) => {
        if (!activo) return;
        setHistorial(null);
        setAviso({ tipo: 'error', texto: err.message });
      });
    return () => {
      activo = false;
    };
  }, [trabajadorId, version]);

  const recargar = (mensaje) => {
    setEditandoId(null);
    setAviso(mensaje ? { tipo: 'ok', texto: mensaje } : null);
    setVersion((v) => v + 1);
  };

  const h = trabajadorId && historial && String(historial.id) === String(trabajadorId) ? historial : null;
  const estado = h ? estadoTrabajador({ bloqueado: h.estado === 'BLOQUEADO', activo: h.estado !== 'INACTIVO' }) : null;
  const evaluacionEnEdicion = h?.evaluaciones.find((ev) => ev.id === editandoId);

  if (h && evaluacionEnEdicion) {
    return (
      <FormularioEvaluacion
        trabajadorId={h.id}
        trabajadorNombre={h.nombre}
        eventoId={evaluacionEnEdicion.eventoId}
        eventoNombre={evaluacionEnEdicion.evento?.nombre ?? `Evento #${evaluacionEnEdicion.eventoId}`}
        rolEvento={evaluacionEnEdicion.rolEvento}
        evaluacion={evaluacionEnEdicion}
        onGuardado={() => recargar('Evaluación actualizada. Los promedios se recalcularon.')}
        onCancelar={() => setEditandoId(null)}
      />
    );
  }

  return (
    <section className="panel">
      <h2>Historial de desempeño</h2>

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
            <option key={t.id} value={t.id}>{t.nombre} — {etiquetaRol(t.rolPrincipal)}</option>
          ))}
        </select>
      </div>

      {h && (
        <>
          <div className="resumen-historial">
            <div className="dato">
              <span>Estado</span>
              <strong><span className={`status ${estado.clase}`}>{estado.texto}</span></strong>
            </div>
            <div className="dato">
              <span>Promedio general</span>
              <strong>{h.promedioGeneral != null ? h.promedioGeneral.toFixed(1) : '—'}</strong>
            </div>
            <div className="dato">
              <span>Evaluaciones</span>
              <strong>{h.totalEvaluaciones}</strong>
            </div>
            <div className="dato">
              <span>Incidentes</span>
              <strong>{h.totalIncidentes}</strong>
            </div>
            <div className="dato">
              <span>Para contratar</span>
              <strong>{h.disponibleParaContratar ? 'Disponible' : 'No disponible'}</strong>
            </div>
          </div>

          <h3 className="seccion-titulo">Promedio por rol</h3>
          {Object.keys(h.promediosPorRol).length === 0 ? (
            <p className="pers-vacio">Aún no hay roles evaluados.</p>
          ) : (
            <div className="resumen-historial">
              {Object.entries(h.promediosPorRol).map(([rol, promedio]) => (
                <div key={rol} className="dato">
                  <span>{etiquetaRol(rol)}</span>
                  <strong>{promedio.toFixed(1)}</strong>
                </div>
              ))}
            </div>
          )}

          <h3 className="seccion-titulo">Evaluaciones registradas ({h.evaluaciones.length})</h3>
          {h.evaluaciones.length === 0 ? (
            <p className="pers-vacio">Este trabajador aún no tiene evaluaciones.</p>
          ) : (
            h.evaluaciones.map((ev) => (
              <TarjetaEvaluacion
                key={ev.id}
                evaluacion={ev}
                onEditar={() => { setAviso(null); setEditandoId(ev.id); }}
                onEliminada={() => recargar('Evaluación eliminada. Los promedios se recalcularon.')}
                onError={(texto) => setAviso({ tipo: 'error', texto })}
              />
            ))
          )}

          <h3 className="seccion-titulo">Incidentes ({h.incidentes.length})</h3>
          {h.incidentes.length === 0 ? (
            <p className="pers-vacio">Sin incidentes registrados.</p>
          ) : (
            h.incidentes.map((i) => (
              <div key={i.id} className="fila-personal">
                <div>
                  <div className="principal">{i.tipo === 'FALTA_GRAVE' ? 'Falta grave' : 'Inasistencia'}</div>
                  <div className="meta">
                    {formatearFechaHora(i.createdAt)}
                    {i.evento && ` · ${i.evento.nombre}`}
                    {i.motivo && ` · ${i.motivo}`}
                  </div>
                </div>
                <span className={`status ${i.tipo === 'FALTA_GRAVE' ? 'cancelled' : 'pending'}`}>{i.tipo === 'FALTA_GRAVE' ? 'Bloqueo' : 'Registro'}</span>
              </div>
            ))
          )}

          <h3 className="seccion-titulo">Registrar incidente</h3>
          <FormularioIncidente
            trabajadorId={h.id}
            asignaciones={asignaciones}
            onRegistrado={() => recargar('Incidente registrado.')}
            onError={(texto) => setAviso({ tipo: 'error', texto })}
          />

          {h.auditoria.length > 0 && (
            <>
              <h3 className="seccion-titulo">Cambios en evaluaciones</h3>
              {h.auditoria.map((a) => (
                <div key={a.id} className="fila-personal">
                  <div>
                    <div className="principal">{a.accion === 'EDITADA' ? 'Evaluación editada' : 'Evaluación eliminada'}</div>
                    <div className="meta">
                      {formatearFechaHora(a.createdAt)}
                      {a.adminId != null && ` · administrador #${a.adminId}`}
                      {a.motivo && ` · ${a.motivo}`}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </section>
  );
}

export default HistorialTrabajador;
