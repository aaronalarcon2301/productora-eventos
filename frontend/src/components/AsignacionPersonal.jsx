
import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';

import {
  ROLES,
  etiquetaRol,
  formatearFecha
} from './personalConstantes';

function AsignacionPersonal() {
  const [eventos, setEventos] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [eventoId, setEventoId] = useState('');
  const [asignadas, setAsignadas] = useState([]);

  const [form, setForm] = useState({
    trabajadorId: '',
    rol: '',
    turno: '',
    horaLlegada: ''
  });

  const [aviso, setAviso] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;

    Promise.all([
      apiFetch('/eventos'),
      apiFetch('/trabajadores?asignables=true')
    ])
      .then(([evs, trs]) => {
        if (!activo) return;

        setEventos(evs);
        setCandidatos(trs);
      })
      .catch(err => {
        if (activo) {
          setAviso({
            tipo: 'error',
            texto: err.message
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [version]);

  useEffect(() => {
    if (!eventoId) {
      setAsignadas([]);
      return;
    }

    let activo = true;

    apiFetch(`/asignaciones/evento/${eventoId}`)
      .then(datos => {
        if (activo) {
          setAsignadas(datos);
        }
      })
      .catch(err => {
        if (activo) {
          setAviso({
            tipo: 'error',
            texto: err.message
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [eventoId, version]);

  const recargar = () => {
    setVersion(v => v + 1);
  };

  const lista = eventoId ? asignadas : [];

  const idsAsignados = new Set(
    lista.map(a => a.trabajadorId)
  );

  const disponibles = candidatos.filter(
    t => !idsAsignados.has(t.id)
  );

  const asignar = async e => {
    e.preventDefault();
    setAviso(null);

    try {
      const resultado = await apiFetch('/asignaciones', {
        method: 'POST',

        body: {
          trabajadorId: Number(form.trabajadorId),
          eventoId: Number(eventoId),

          ...(form.rol
            ? { rol: form.rol }
            : {}),

          turno: form.turno,
          horaLlegada: form.horaLlegada
        }
      });

      setForm({
        trabajadorId: '',
        rol: '',
        turno: '',
        horaLlegada: ''
      });

      setAviso({
        tipo:
          resultado.notificacionEstado === 'ERROR'
            ? 'error'
            : 'ok',

        texto:
          `Trabajador asignado. ${resultado.correoMensaje}`
      });

      recargar();

    } catch (err) {
      setAviso({
        tipo: 'error',
        texto: err.message
      });
    }
  };

  const reintentarCorreo = async a => {
    setAviso(null);

    try {
      const respuesta = await apiFetch(
        `/asignaciones/${a.id}/notificacion/reintentar`,
        {
          method: 'POST'
        }
      );

      setAviso({
        tipo:
          respuesta.estado === 'ERROR'
            ? 'error'
            : 'ok',

        texto: respuesta.mensaje
      });

      recargar();

    } catch (err) {
      setAviso({
        tipo: 'error',
        texto: err.message
      });
    }
  };

  const quitar = async a => {
    if (
      !window.confirm(
        `¿Quitar a ${a.trabajador.nombre} de este evento?`
      )
    ) {
      return;
    }

    setAviso(null);

    try {
      await apiFetch(
        `/asignaciones/${a.id}`,
        {
          method: 'DELETE'
        }
      );

      setAviso({
        tipo: 'ok',
        texto: 'Asignación eliminada.'
      });

      recargar();

    } catch (err) {
      setAviso({
        tipo: 'error',
        texto: err.message
      });
    }
  };

  return (
    <section className="panel">
      <h2>Asignar personal a eventos</h2>

      {aviso && (
        <div className={`pers-alert ${aviso.tipo}`}>
          {aviso.texto}
        </div>
      )}

      {/* SELECCIÓN DEL EVENTO */}

      <div className="campo">
        <label>Evento</label>

        <select
          value={eventoId}
          onChange={e => {
            setEventoId(e.target.value);
            setAviso(null);
          }}
        >
          <option value="">
            Selecciona un evento…
          </option>

          {eventos.map(ev => (
            <option
              key={ev.id}
              value={ev.id}
              disabled={ev.cancelado}
            >
              {ev.nombre} — {formatearFecha(ev.fecha)}
              {ev.cancelado ? ' (cancelado)' : ''}
            </option>
          ))}
        </select>
      </div>

      {eventoId && (
        <>
          {/* TRABAJADORES ASIGNADOS */}

          <h3 className="seccion-titulo">
            Personal asignado ({lista.length})
          </h3>

          {lista.length === 0 ? (
            <p className="pers-vacio">
              Aún no hay personal asignado a este evento.
            </p>
          ) : (
            lista.map(a => (
              <div
                key={a.id}
                className="fila-personal"
              >
                <div>
                  <div className="principal">
                    {a.trabajador.nombre}
                  </div>

                  <div className="meta">
                    {etiquetaRol(a.rol)}
                  </div>

                  {a.turno && a.horaLlegada && (
                    <div className="meta">
                      Turno:{' '}
                      {a.turno === 'DIURNO'
                        ? 'Diurno'
                        : 'Nocturno'}
                      {' · '}
                      Llegada: {a.horaLlegada}
                    </div>
                  )}

                  {a.turno && (
                    <div className="meta">
                      Correo:{' '}

                      {a.notificacionEstado === 'ENVIADA'
                        ? 'Enviado'
                        : a.notificacionEstado === 'ERROR'
                          ? 'Error al enviar'
                          : a.notificacionEstado === 'ENVIANDO'
                            ? 'Enviando'
                            : 'Pendiente'}

                      {a.notificacionEstado === 'ERROR' &&
                        a.notificacionError
                        ? ` · ${a.notificacionError}`
                        : ''}
                    </div>
                  )}
                </div>

                <div className="acciones">
                  <span
                    className={`status ${
                      a.evaluada
                        ? 'confirmed'
                        : 'pending'
                    }`}
                  >
                    {a.evaluada
                      ? 'Evaluado'
                      : 'Sin evaluar'}
                  </span>

                  {a.turno &&
                    ['ERROR', 'PENDIENTE'].includes(
                      a.notificacionEstado
                    ) && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => reintentarCorreo(a)}
                      >
                        Reintentar correo
                      </button>
                    )}

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => quitar(a)}
                    disabled={a.evaluada}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}

          {/* FORMULARIO DE NUEVA ASIGNACIÓN */}

          <h3 className="seccion-titulo">
            Agregar trabajador
          </h3>

          <form onSubmit={asignar}>
            <div className="grid-2">
              <div className="campo">
                <label>Trabajador (solo activos y sin bloqueo)</label>

                <select
                  required
                  value={form.trabajadorId}
                  onChange={e => {
                    const t = candidatos.find(
                      c => String(c.id) === e.target.value
                    );

                    setForm({
                      ...form,
                      trabajadorId: e.target.value,
                      rol: t ? t.rolPrincipal : '',

                      turno: [
                        'DIURNO',
                        'NOCTURNO'
                      ].includes(t?.disponibilidadTurno)
                        ? t.disponibilidadTurno
                        : '',

                      horaLlegada: ''
                    });
                  }}
                >
                  <option value="">
                    Selecciona…
                  </option>

                  {disponibles.map(t => (
                    <option
                      key={t.id}
                      value={t.id}
                    >
                      {t.nombre} — {etiquetaRol(t.rolPrincipal)}

                      {t.promedioGeneral != null
                        ? ` (★ ${t.promedioGeneral.toFixed(1)})`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label>Rol en este evento</label>

                <select
                  value={form.rol}
                  onChange={e => {
                    setForm({
                      ...form,
                      rol: e.target.value
                    });
                  }}
                >
                  <option value="">
                    Rol principal del trabajador
                  </option>

                  {ROLES.map(r => (
                    <option
                      key={r.valor}
                      value={r.valor}
                    >
                      {r.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* NUEVOS CAMPOS DEL REQUISITO 10 */}

            <div className="grid-2">
              <div className="campo">
                <label>
                  Turno del trabajador
                </label>

                <select
                  required
                  value={form.turno}
                  onChange={e => {
                    setForm({
                      ...form,
                      turno: e.target.value
                    });
                  }}
                >
                  <option value="">
                    Selecciona un turno…
                  </option>

                  <option value="DIURNO">
                    Diurno
                  </option>

                  <option value="NOCTURNO">
                    Nocturno
                  </option>
                </select>
              </div>

              <div className="campo">
                <label>
                  Hora de llegada (Utilice formato 24h)
                </label>

                <input
                  required
                  type="time"
                  value={form.horaLlegada}
                  onChange={e => {
                    setForm({
                      ...form,
                      horaLlegada: e.target.value
                    });
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn"
            >
              Asignar y notificar
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export default AsignacionPersonal;
