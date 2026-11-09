import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import { ROLES, etiquetaRol, formatearFecha } from './personalConstantes';

function AsignacionPersonal() {
  const [eventos, setEventos] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [eventoId, setEventoId] = useState('');
  const [asignadas, setAsignadas] = useState([]);
  const [form, setForm] = useState({ trabajadorId: '', rol: '' });
  const [aviso, setAviso] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    Promise.all([apiFetch('/eventos'), apiFetch('/trabajadores?asignables=true')])
      .then(([evs, trs]) => {
        if (!activo) return;
        setEventos(evs);
        setCandidatos(trs);
      })
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, [version]);

  useEffect(() => {
    if (!eventoId) return;
    let activo = true;
    apiFetch(`/asignaciones/evento/${eventoId}`)
      .then((datos) => activo && setAsignadas(datos))
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, [eventoId, version]);

  const recargar = () => setVersion((v) => v + 1);
  const lista = eventoId ? asignadas : [];
  const idsAsignados = new Set(lista.map((a) => a.trabajadorId));
  const disponibles = candidatos.filter((t) => !idsAsignados.has(t.id));

  const asignar = async (e) => {
    e.preventDefault();
    setAviso(null);
    try {
      await apiFetch('/asignaciones', {
        method: 'POST',
        body: {
          trabajadorId: Number(form.trabajadorId),
          eventoId: Number(eventoId),
          ...(form.rol ? { rol: form.rol } : {}),
        },
      });
      setForm({ trabajadorId: '', rol: '' });
      setAviso({ tipo: 'ok', texto: 'Trabajador asignado al evento.' });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  const quitar = async (a) => {
    if (!window.confirm(`¿Quitar a ${a.trabajador.nombre} de este evento?`)) return;
    setAviso(null);
    try {
      await apiFetch(`/asignaciones/${a.id}`, { method: 'DELETE' });
      setAviso({ tipo: 'ok', texto: 'Asignación eliminada.' });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  return (
    <section className="panel">
      <h2>Asignar personal a eventos</h2>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="campo">
        <label>Evento</label>
        <select value={eventoId} onChange={(e) => { setEventoId(e.target.value); setAviso(null); }}>
          <option value="">Selecciona un evento…</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id} disabled={ev.cancelado}>
              {ev.nombre} — {formatearFecha(ev.fecha)}
              {ev.cancelado ? ' (cancelado)' : ''}
            </option>
          ))}
        </select>
      </div>

      {eventoId && (
        <>
          <h3 className="seccion-titulo">Personal asignado ({lista.length})</h3>
          {lista.length === 0 ? (
            <p className="pers-vacio">Aún no hay personal asignado a este evento.</p>
          ) : (
            lista.map((a) => (
              <div key={a.id} className="fila-personal">
                <div>
                  <div className="principal">{a.trabajador.nombre}</div>
                  <div className="meta">{etiquetaRol(a.rol)}</div>
                </div>
                <div className="acciones">
                  <span className={`status ${a.evaluada ? 'confirmed' : 'pending'}`}>
                    {a.evaluada ? 'Evaluado' : 'Sin evaluar'}
                  </span>
                  <button className="btn btn-danger btn-sm" onClick={() => quitar(a)} disabled={a.evaluada}>
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}

          <h3 className="seccion-titulo">Agregar trabajador</h3>
          <form onSubmit={asignar}>
            <div className="grid-2">
              <div className="campo">
                <label>Trabajador (solo activos y sin bloqueo)</label>
                <select
                  required
                  value={form.trabajadorId}
                  onChange={(e) => {
                    const t = candidatos.find((c) => String(c.id) === e.target.value);
                    setForm({ trabajadorId: e.target.value, rol: t ? t.rolPrincipal : '' });
                  }}
                >
                  <option value="">Selecciona…</option>
                  {disponibles.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} — {etiquetaRol(t.rolPrincipal)}
                      {t.promedioGeneral != null ? ` (★ ${t.promedioGeneral.toFixed(1)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Rol en este evento</label>
                <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  <option value="">Rol principal del trabajador</option>
                  {ROLES.map((r) => (
                    <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn">Asignar</button>
          </form>
        </>
      )}
    </section>
  );
}

export default AsignacionPersonal;
