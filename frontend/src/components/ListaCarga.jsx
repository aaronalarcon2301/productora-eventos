import { useEffect, useState } from 'react';
import { apiFetch } from '../api/apiFetch';

const ESTADOS = {
  SIN_EQUIPOS: 'Sin equipos cotizados',
  PENDIENTE: 'Pendiente de carga',
  EN_PROCESO: 'Carga en proceso',
  COMPLETA: 'Carga completa'
};

const fechaCL = valor =>
  new Date(valor).toLocaleDateString('es-CL', {
    timeZone: 'UTC'
  });

export default function ListaCarga({ rol }) {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState('');
  const [lista, setLista] = useState(null);
  const [edicion, setEdicion] = useState({});

  const [version, setVersion] = useState(0);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [guardandoId, setGuardandoId] = useState(null);

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;

    setCargandoEventos(true);

    apiFetch('/listas-carga/eventos')
      .then(datos => {
        if (!activo) return;

        if (!Array.isArray(datos)) {
          throw new Error('Respuesta inválida del listado de eventos.');
        }

        setEventos(datos);

        setEventoId(anterior =>
          datos.some(e => String(e.id) === anterior)
            ? anterior
            : (datos[0] ? String(datos[0].id) : '')
        );
      })
      .catch(err => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargandoEventos(false);
      });

    return () => {
      activo = false;
    };
  }, [version]);

  useEffect(() => {
    if (!eventoId) {
      setLista(null);
      return;
    }

    let activo = true;

    setCargandoLista(true);
    setLista(null);

    apiFetch(`/listas-carga/eventos/${eventoId}`)
      .then(datos => {
        if (!activo) return;

        if (!Array.isArray(datos?.items)) {
          throw new Error('Respuesta inválida de la lista de carga.');
        }

        setLista(datos);

        const borradores = Object.fromEntries(
          datos.items.map(item => [
            item.id,
            {
              cantidadCargada: String(item.cantidadCargada),
              observacionCarga: item.observacionCarga || ''
            }
          ])
        );

        setEdicion(borradores);
      })
      .catch(err => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargandoLista(false);
      });

    return () => {
      activo = false;
    };
  }, [eventoId, version]);

  const cambiarItem = (id, campo, valor) => {
    setEdicion(anterior => ({
      ...anterior,
      [id]: {
        ...anterior[id],
        [campo]: valor
      }
    }));
  };

  const guardarItem = async (item) => {
    const datos = edicion[item.id];

    const cantidad = datos?.cantidadCargada === ''
      ? null
      : Number(datos?.cantidadCargada);

    setGuardandoId(item.id);
    setError('');
    setMensaje('');

    try {
      await apiFetch(`/listas-carga/items/${item.id}`, {
        method: 'PATCH',
        body: {
          cantidadCargada: cantidad,
          observacionCarga:
            datos.observacionCarga.trim() || null
        }
      });

      setMensaje(
        `Carga de "${item.nombreEquipo}" guardada correctamente.`
      );

      setVersion(v => v + 1);

    } catch (err) {
      setError(err.message);

    } finally {
      setGuardandoId(null);
    }
  };

  const finalizado = Boolean(lista?.evento?.finalizadoAt);
  const puedeEditar =
    (rol === 'GERENTE' || rol === 'TRABAJADOR') &&
    !finalizado;

  return (
    <section>

      <header className="page-heading">
        <div>
          <h1>Lista de chequeo de carga</h1>
          <p>
            Equipos contratados para eventos con
            presupuesto aprobado.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setError('');
            setMensaje('');
            setVersion(v => v + 1);
          }}
        >
          Actualizar
        </button>
      </header>

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

      <div className="panel">

        <label htmlFor="evento-lista-carga">
          Evento aprobado
        </label>

        <select
          id="evento-lista-carga"
          value={eventoId}
          onChange={e => {
            setError('');
            setMensaje('');
            setEventoId(e.target.value);
          }}
          disabled={
            cargandoEventos ||
            eventos.length === 0
          }
          style={{ marginTop: 10 }}
        >
          {eventos.length === 0 && (
            <option value="">
              No hay eventos aprobados
            </option>
          )}

          {eventos.map(evento => (
            <option
              key={evento.id}
              value={evento.id}
            >
              {evento.nombre}
              {' — '}
              {fechaCL(evento.fecha)}
              {' — '}
              {ESTADOS[evento.estado]}
            </option>
          ))}
        </select>

      </div>

      {cargandoLista && (
        <p>Cargando lista...</p>
      )}

      {!cargandoLista && lista && (
        <div className="panel">

          <h2>{lista.evento.nombre}</h2>

          <p>
            <strong>Cliente:</strong>{' '}
            {lista.evento.cliente?.nombre || 'Sin cliente'}
            {' · '}
            <strong>Lugar:</strong>{' '}
            {lista.evento.lugar?.nombre || 'Sin lugar'}
          </p>

          <p>
            <strong>Fecha:</strong>{' '}
            {fechaCL(lista.evento.fecha)}
          </p>

          <p>
            <strong>Estado:</strong>{' '}
            {ESTADOS[lista.estado]}
          </p>

          <p>
            <strong>Unidades cargadas:</strong>{' '}
            {lista.unidadesCargadas} de {lista.totalUnidades}
          </p>

          <div
            style={{
              height: 10,
              borderRadius: 12,
              overflow: 'hidden',
              background: 'var(--hairline)',
              marginBottom: 20
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${lista.porcentaje}%`,
                background: 'var(--confirm)'
              }}
            />
          </div>

          <p>
            <strong>Avance:</strong>{' '}
            {lista.porcentaje}%
          </p>

          {finalizado && (
            <p className="notice">
              Este evento está finalizado. La lista es de solo lectura:
              se muestran las cantidades y observaciones guardadas.
            </p>
          )}

          {!finalizado && !puedeEditar && (
            <p className="notice">
              No tienes permisos para editar esta lista de carga.
            </p>
          )}

          {lista.items.length === 0 ? (
            <p>
              Este evento no tiene equipos en su cotización.
              La lista se genera desde los equipos incluidos
              en la cotización aprobada, no desde el inventario
              completo.
            </p>
          ) : (

            <div style={{ display: 'grid', gap: 16 }}>

              {lista.items.map(item => {
                const borrador = edicion[item.id] || {
                  cantidadCargada: String(item.cantidadCargada),
                  observacionCarga: item.observacionCarga || ''
                };

                const completado =
                  Number(borrador.cantidadCargada) ===
                  item.cantidad;

                const guardadoCompleto =
                  item.cantidadCargada === item.cantidad;

                return (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid var(--hairline)',
                      padding: 16,
                      borderRadius: 10
                    }}
                  >

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12
                      }}
                    >
                      <strong>{item.nombreEquipo}</strong>

                      <span className={`status ${
                        guardadoCompleto
                          ? 'confirmed'
                          : 'pending'
                      }`}>
                        {guardadoCompleto
                          ? 'Completo'
                          : 'Pendiente'}
                      </span>
                    </div>

                    <p>
                      Contratadas:{' '}
                      <strong>
                        {item.cantidad} unidades
                      </strong>
                    </p>

                    {puedeEditar ? (
                      <>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 14
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={completado}
                            onChange={e => cambiarItem(
                              item.id,
                              'cantidadCargada',
                              e.target.checked
                                ? String(item.cantidad)
                                : '0'
                            )}
                            disabled={guardandoId !== null}
                            style={{
                              width: 18,
                              height: 18,
                              flexShrink: 0
                            }}
                          />
                          Marcar todas las unidades como cargadas
                        </label>

                        <label htmlFor={`cantidad-${item.id}`}>
                          Unidades efectivamente cargadas
                        </label>

                        <input
                          id={`cantidad-${item.id}`}
                          type="number"
                          min="0"
                          max={item.cantidad}
                          step="1"
                          value={borrador.cantidadCargada}
                          onChange={e => cambiarItem(
                            item.id,
                            'cantidadCargada',
                            e.target.value
                          )}
                          disabled={guardandoId !== null}
                          style={{ margin: '8px 0 14px' }}
                        />

                        <label htmlFor={`observacion-${item.id}`}>
                          Observación (opcional)
                        </label>

                        <input
                          id={`observacion-${item.id}`}
                          value={borrador.observacionCarga}
                          onChange={e => cambiarItem(
                            item.id,
                            'observacionCarga',
                            e.target.value
                          )}
                          placeholder="Ej: Faltan 2 micrófonos"
                          disabled={guardandoId !== null}
                          style={{ margin: '8px 0 14px' }}
                        />

                        <button
                          type="button"
                          className="btn"
                          onClick={() => guardarItem(item)}
                          disabled={guardandoId !== null}
                        >
                          {guardandoId === item.id
                            ? 'Guardando...'
                            : 'Guardar carga'}
                        </button>
                      </>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        <p style={{ margin: 0 }}>
                          <strong>Unidades cargadas:</strong>{' '}
                          {item.cantidadCargada} de {item.cantidad}
                        </p>
                        <p style={{ margin: 0, overflowWrap: 'anywhere' }}>
                          <strong>Observación:</strong>{' '}
                          {item.observacionCarga || 'Sin observaciones registradas'}
                        </p>
                      </div>
                    )}

                    {item.cargaActualizadaAt && (
                      <p
                        className="helper-text"
                        style={{ marginTop: 10 }}
                      >
                        Último cambio:{' '}
                        {new Date(
                          item.cargaActualizadaAt
                        ).toLocaleString('es-CL')}

                        {item.cargaActualizadaPor?.nombre
                          ? ` · ${item.cargaActualizadaPor.nombre}`
                          : ''}
                      </p>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        </div>
      )}
    </section>
  );
}