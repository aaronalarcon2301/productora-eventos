import { useState, useEffect } from 'react';
import './personal.css';
import { apiFetch } from '../api/apiFetch';
import { etiquetaRol, formatearFecha } from './personalConstantes';

function estadoEvento(a) {
  if (a.evento.cancelado) return { texto: 'Evento cancelado', clase: 'cancelled' };
  if (a.finalizado) return { texto: 'Finalizado', clase: 'finalizado' };
  return { texto: 'Próximo', clase: 'pending' };
}

function estadoRespuesta(a) {
  if (a.respuesta === 'CONFIRMADA') return { texto: 'Confirmaste', clase: 'confirmed' };
  if (a.respuesta === 'RECHAZADA') return { texto: 'No asistirás', clase: 'cancelled' };
  return { texto: 'Sin responder', clase: 'pending' };
}

function MisAsignaciones() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);
  const [rechazando, setRechazando] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    apiFetch('/mi-perfil/asignaciones')
      .then((datos) => {
        if (!activo) return;
        setAsignaciones(datos);
        setCargando(false);
      })
      .catch((err) => {
        if (!activo) return;
        setAviso({ tipo: 'error', texto: err.message });
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [version]);

  const responder = async (asignacion, respuesta, comentario) => {
    setEnviando(true);
    setAviso(null);
    try {
      await apiFetch(`/mi-perfil/asignaciones/${asignacion.id}/respuesta`, {
        method: 'POST',
        body: { respuesta, comentario },
      });
      setRechazando(null);
      setMotivo('');
      setAviso({
        tipo: 'ok',
        texto: respuesta === 'CONFIRMADA' ? 'Confirmaste tu asistencia.' : 'Avisamos que no podrás asistir.',
      });
      setVersion((v) => v + 1);
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  const pendientes = asignaciones.filter(
    (a) => a.respuesta === 'PENDIENTE' && !a.finalizado && !a.evento.cancelado
  ).length;

  return (
    <section className="pagina">
      <header className="pagina-cab">
        <h1>Mis asignaciones</h1>
        <p>Eventos en los que te asignaron. Confirma si podrás asistir.</p>
      </header>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      {pendientes > 0 && (
        <div className="pers-alert ok">
          Tienes {pendientes} {pendientes === 1 ? 'evento' : 'eventos'} por confirmar.
        </div>
      )}

      <div className="panel">
        {cargando ? (
          <p className="pers-vacio">Cargando…</p>
        ) : asignaciones.length === 0 ? (
          <p className="pers-vacio">Todavía no tienes eventos asignados.</p>
        ) : (
          asignaciones.map((a) => {
            const evento = estadoEvento(a);
            const respuesta = estadoRespuesta(a);
            const abierto = !a.finalizado && !a.evento.cancelado;
            return (
              <div key={a.id} className="fila-personal">
                <div>
                  <div className="principal">{a.evento.nombre}</div>
                  <div className="meta">
                    {formatearFecha(a.evento.fecha)}
                    {a.evento.lugar && ` · ${a.evento.lugar}`} · {etiquetaRol(a.rol)}
                  </div>
                  <div className="insignias">
                    <span className={`status ${evento.clase}`}>{evento.texto}</span>
                    {abierto && <span className={`status ${respuesta.clase}`}>{respuesta.texto}</span>}
                    {a.evaluada && <span className="status confirmed">Evaluado</span>}
                  </div>
                  {a.comentarioRespuesta && <div className="meta">Tu motivo: {a.comentarioRespuesta}</div>}

                  {rechazando === a.id && (
                    <div className="campo" style={{ marginTop: 12 }}>
                      <label>¿Por qué no puedes asistir?</label>
                      <textarea
                        rows={2}
                        maxLength={200}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Ej: Tengo examen ese día"
                      />
                      <div className="acciones">
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={enviando || !motivo.trim()}
                          onClick={() => responder(a, 'RECHAZADA', motivo.trim())}
                        >
                          Enviar
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setRechazando(null);
                            setMotivo('');
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {abierto && rechazando !== a.id && (
                  <div className="acciones">
                    {a.respuesta !== 'CONFIRMADA' && (
                      <button className="btn btn-sm" disabled={enviando} onClick={() => responder(a, 'CONFIRMADA')}>
                        Confirmar
                      </button>
                    )}
                    {a.respuesta !== 'RECHAZADA' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={enviando}
                        onClick={() => {
                          setAviso(null);
                          setMotivo('');
                          setRechazando(a.id);
                        }}
                      >
                        No podré asistir
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default MisAsignaciones;
