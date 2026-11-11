import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import { formatearFecha } from './personalConstantes';
import { ESTADOS_RESERVA, etiquetaCategoria } from './equiposConstantes';

const DEVOLUCION_VACIA = { danada: '', faltante: '', observacion: '' };

function EntregaDevolucion() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState('');
  const [reservas, setReservas] = useState([]);
  const [devoluciones, setDevoluciones] = useState({});
  const [aviso, setAviso] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    apiFetch('/eventos')
      .then((datos) => activo && setEventos(datos))
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!eventoId) return;
    let activo = true;
    apiFetch(`/reservas-equipo/evento/${eventoId}`)
      .then((datos) => activo && setReservas(datos))
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, [eventoId, version]);

  const recargar = () => setVersion((v) => v + 1);
  const evento = eventos.find((e) => String(e.id) === eventoId);
  const lista = eventoId ? reservas : [];
  const devueltas = lista.filter((r) => r.estado === 'DEVUELTO');

  const borrador = (id) => devoluciones[id] ?? DEVOLUCION_VACIA;
  const editarBorrador = (id, campo, valor) =>
    setDevoluciones({ ...devoluciones, [id]: { ...borrador(id), [campo]: valor } });

  const entregar = async (r) => {
    setAviso(null);
    try {
      await apiFetch(`/reservas-equipo/${r.id}/entregar`, { method: 'POST' });
      setAviso({ tipo: 'ok', texto: `"${r.equipo.nombre}" marcado como entregado.` });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  const devolver = async (r) => {
    const d = borrador(r.id);
    setAviso(null);
    try {
      await apiFetch(`/reservas-equipo/${r.id}/devolver`, {
        method: 'POST',
        body: {
          cantidadDanada: d.danada === '' ? 0 : Number(d.danada),
          cantidadFaltante: d.faltante === '' ? 0 : Number(d.faltante),
          observacion: d.observacion,
        },
      });
      setAviso({ tipo: 'ok', texto: `Devolución de "${r.equipo.nombre}" registrada.` });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  const totales = devueltas.reduce(
    (t, r) => ({
      alStock: t.alStock + (r.cantidad - r.cantidadDanada - r.cantidadFaltante),
      danadas: t.danadas + r.cantidadDanada,
      faltantes: t.faltantes + r.cantidadFaltante,
    }),
    { alStock: 0, danadas: 0, faltantes: 0 }
  );

  return (
    <section className="panel">
      <h2>Entrega y devolución de equipos</h2>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="campo">
        <label>Evento</label>
        <select value={eventoId} onChange={(e) => { setEventoId(e.target.value); setDevoluciones({}); setAviso(null); }}>
          <option value="">Selecciona un evento…</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id} disabled={ev.cancelado}>
              {ev.nombre} — {formatearFecha(ev.fecha)}
              {ev.cancelado ? ' (cancelado)' : ''}
            </option>
          ))}
        </select>
      </div>

      {eventoId && evento && (
        <>
          <div className="cabecera-evento">
            <div className="dato"><span>Fecha</span><strong>{formatearFecha(evento.fecha)}</strong></div>
            <div className="dato"><span>Equipos</span><strong>{lista.length}</strong></div>
            <div className="dato"><span>Devueltos</span><strong>{devueltas.length} de {lista.length}</strong></div>
          </div>

          <h3 className="seccion-titulo">Checklist</h3>
          {lista.length === 0 ? (
            <p className="pers-vacio">Este evento no tiene equipos reservados.</p>
          ) : (
            lista.map((r) => {
              const estado = ESTADOS_RESERVA[r.estado];
              const d = borrador(r.id);
              return (
                <div key={r.id} className="fila-reserva">
                  <div className="cabecera">
                    <div>
                      <div className="principal">{r.equipo.nombre}</div>
                      <div className="meta">
                        {etiquetaCategoria(r.equipo.categoria)} · {r.cantidad} unidad(es)
                        {r.responsable && ` · A cargo de ${r.responsable.nombre}`}
                      </div>
                    </div>
                    <div className="acciones">
                      <span className={`status ${estado.clase}`}>{estado.texto}</span>
                      {r.estado === 'RESERVADO' && (
                        <button className="btn btn-sm" onClick={() => entregar(r)}>Marcar entregado</button>
                      )}
                    </div>
                  </div>

                  {r.estado === 'ENTREGADO' && (
                    <div className="devolucion-form">
                      <div className="campo">
                        <label>Dañadas</label>
                        <input type="number" min="0" max={r.cantidad} value={d.danada} placeholder="0" onChange={(e) => editarBorrador(r.id, 'danada', e.target.value)} />
                      </div>
                      <div className="campo">
                        <label>Faltantes</label>
                        <input type="number" min="0" max={r.cantidad} value={d.faltante} placeholder="0" onChange={(e) => editarBorrador(r.id, 'faltante', e.target.value)} />
                      </div>
                      <div className="campo">
                        <label>Observación</label>
                        <input value={d.observacion} placeholder="Obligatoria si hay daños o faltantes" onChange={(e) => editarBorrador(r.id, 'observacion', e.target.value)} />
                      </div>
                      <button className="btn btn-sm" onClick={() => devolver(r)}>Registrar devolución</button>
                    </div>
                  )}

                  {r.estado === 'DEVUELTO' && (
                    <div className="resultado-devolucion">
                      <strong>{r.cantidad - r.cantidadDanada - r.cantidadFaltante}</strong> volvieron en buen estado ·{' '}
                      <strong>{r.cantidadDanada}</strong> dañadas · <strong>{r.cantidadFaltante}</strong> faltantes
                      {r.observacion && ` — ${r.observacion}`}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {devueltas.length > 0 && (
            <>
              <h3 className="seccion-titulo">Resultado de las devoluciones</h3>
              <div className="resumen-cierre">
                <div className="ok">
                  <strong>{totales.alStock}</strong>
                  <span>unidades volvieron al stock y quedan disponibles</span>
                </div>
                <div className="dano">
                  <strong>{totales.danadas}</strong>
                  <span>unidades pasaron a mantención</span>
                </div>
                <div className="falta">
                  <strong>{totales.faltantes}</strong>
                  <span>unidades faltantes, descontadas del stock total</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

export default EntregaDevolucion;
