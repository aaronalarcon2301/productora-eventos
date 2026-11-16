import { useCallback, useEffect, useState } from 'react';

import { apiFetch } from '../api/apiFetch';

import CancelacionEvento from './CancelacionEvento';
import FinalizacionEvento from './FinalizacionEvento';
import CotizarEvento from './CotizarEvento';

const pesos = (valor) => {
  const numero = Number(valor ?? 0);

  return `$${Number.isFinite(numero)
    ? numero.toLocaleString('es-CL')
    : '0'}`;
};

const fechaCL = (valor) => {
  if (!valor) return 'Sin fecha';

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return 'Fecha inválida';
  }

  return fecha.toLocaleDateString('es-CL', {
    timeZone: 'UTC'
  });
};

const estadoClase = (estado) => {
  switch (estado) {
    case 'APROBADO':
      return 'confirmed';

    case 'RECHAZADO':
      return 'cancelled';

    default:
      return 'pending';
  }
};

const estadoTexto = (estado) => {
  switch (estado) {
    case 'APROBADO':
      return 'Aprobado';

    case 'RECHAZADO':
      return 'Rechazado';

    default:
      return 'Pendiente';
  }
};

export default function EventoCatalogo({ rol, setVista }) {
  const esGerente = rol === 'GERENTE';

  const [eventos, setEventos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);

  const [catalogos, setCatalogos] = useState({
    clientes: [],
    lugares: []
  });

  const [filtros, setFiltros] = useState({
    clienteId: '',
    lugarId: ''
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

  const [errorEventos, setErrorEventos] = useState('');
  const [errorCatalogos, setErrorCatalogos] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarEventos = useCallback(async () => {
    setCargandoEventos(true);
    setErrorEventos('');

    try {
      const params = new URLSearchParams();

      if (filtros.clienteId) {
        params.set('clienteId', filtros.clienteId);
      }

      if (filtros.lugarId) {
        params.set('lugarId', filtros.lugarId);
      }

      const query = params.toString();

      const ruta = query
        ? `/eventos?${query}`
        : '/eventos';

      const respuesta = await apiFetch(ruta);

      if (!Array.isArray(respuesta)) {
        throw new Error(
          'El servidor no devolvió una lista válida de eventos.'
        );
      }

      setEventos(respuesta);

    } catch (error) {
      console.error('Error al cargar eventos:', error);

      setEventos([]);

      setErrorEventos(
        error.message || 'No se pudieron cargar los eventos.'
      );

    } finally {
      setCargandoEventos(false);
    }
  }, [filtros.clienteId, filtros.lugarId]);

  const cargarCatalogos = useCallback(async () => {
    setCargandoCatalogos(true);
    setErrorCatalogos('');

    try {
      const respuesta = await apiFetch('/catalogos');

      const clientes = Array.isArray(respuesta?.clientes)
        ? respuesta.clientes
        : [];

      const lugares = Array.isArray(respuesta?.lugares)
        ? respuesta.lugares
        : [];

      setCatalogos({
        clientes,
        lugares
      });

    } catch (error) {
      console.error('Error al cargar catálogos:', error);

      setCatalogos({
        clientes: [],
        lugares: []
      });

      setErrorCatalogos(
        error.message ||
        'No se pudieron cargar los clientes y lugares.'
      );

    } finally {
      setCargandoCatalogos(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  const actualizarEvento = (eventoActualizado) => {
    if (!eventoActualizado?.id) return;

    setSeleccionado(anterior => {
      if (!anterior) return null;

      if (anterior.id !== eventoActualizado.id) {
        return anterior;
      }

      return {
        ...anterior,
        ...eventoActualizado
      };
    });

    setEventos(anteriores => {
      if (!Array.isArray(anteriores)) return [];

      return anteriores.map(evento =>
        evento.id === eventoActualizado.id
          ? {
              ...evento,
              ...eventoActualizado
            }
          : evento
      );
    });
  };

  const eliminarEvento = async (evento) => {
    if (!esGerente) {
      setErrorEventos(
        'Solo el gerente puede eliminar eventos.'
      );
      return;
    }

    if (!evento.cancelado) {
      window.alert(
        'Primero debes cancelar el evento para eliminarlo.'
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar "${evento.nombre}"?`
    );

    if (!confirmar) return;

    try {
      setErrorEventos('');

      await apiFetch(`/eventos/${evento.id}`, {
        method: 'DELETE'
      });

      setSeleccionado(null);

      setMensaje('Evento eliminado correctamente.');

      await cargarEventos();

    } catch (error) {
      console.error('Error al eliminar evento:', error);

      setErrorEventos(error.message);
    }
  };

  const cotizacionGuardada = async () => {
    setMostrarModal(false);
    setSeleccionado(null);

    setMensaje(
      'Cotización enviada correctamente. ' +
      'El gerente debe revisar y aprobar el presupuesto.'
    );

    await cargarEventos();
  };

  const actualizarTodo = async () => {
    await Promise.all([
      cargarEventos(),
      cargarCatalogos()
    ]);
  };

  return (
    <div>

      <header className="page-heading">
        <div>
          <h1>
            {esGerente
              ? 'Listado de eventos'
              : 'Cotizaciones y eventos'}
          </h1>

          <p>
            {esGerente
              ? 'Consulta y administra los eventos registrados.'
              : 'Prepara cotizaciones y consulta los eventos aprobados.'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={actualizarTodo}
          disabled={cargandoEventos || cargandoCatalogos}
        >
          {cargandoEventos
            ? 'Actualizando...'
            : 'Actualizar'}
        </button>
      </header>

      {errorEventos && (
        <div className="notice notice-error" role="alert">
          <strong>Error al cargar eventos:</strong>{' '}
          {errorEventos}
        </div>
      )}

      {errorCatalogos && (
        <div className="notice notice-error" role="alert">
          <strong>Error al cargar catálogos:</strong>{' '}
          {errorCatalogos}
        </div>
      )}

      {mensaje && (
        <div className="notice notice-ok">
          <p>{mensaje}</p>

          {!esGerente && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setVista('mis-solicitudes')}
            >
              Ver mis solicitudes
            </button>
          )}
        </div>
      )}

      <div className="filtros-container">

        <select
          value={filtros.clienteId}
          onChange={e => {
            setFiltros(anterior => ({
              ...anterior,
              clienteId: e.target.value
            }));
          }}
          disabled={cargandoCatalogos}
        >
          <option value="">Todos los clientes</option>

          {catalogos.clientes.map(cliente => (
            <option
              key={cliente.id}
              value={cliente.id}
            >
              {cliente.nombre}
            </option>
          ))}
        </select>

        <select
          value={filtros.lugarId}
          onChange={e => {
            setFiltros(anterior => ({
              ...anterior,
              lugarId: e.target.value
            }));
          }}
          disabled={cargandoCatalogos}
        >
          <option value="">Todos los lugares</option>

          {catalogos.lugares.map(lugar => (
            <option
              key={lugar.id}
              value={lugar.id}
            >
              {lugar.nombre}
            </option>
          ))}
        </select>

      </div>

      <section className="panel">

        <div className="page-heading">
          <div>
            <h2>
              {esGerente
                ? 'Eventos registrados'
                : 'Eventos aprobados'}
            </h2>

            <p>
              {esGerente
                ? 'Revisa los eventos y sus estados.'
                : 'Solo se muestran eventos con presupuesto aprobado.'}
            </p>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() => {
              setMensaje('');
              setMostrarModal(true);
            }}
          >
            + Nueva cotización
          </button>
        </div>

        {cargandoEventos && (
          <p>Cargando eventos...</p>
        )}

        {!cargandoEventos &&
          eventos.length === 0 &&
          !errorEventos && (
            <p>
              {esGerente
                ? 'No hay eventos registrados.'
                : 'Todavía no hay eventos aprobados.'}
            </p>
          )}

        {!cargandoEventos && eventos.length > 0 && (
          <ul className="lista-simple">

            {eventos.map(evento => (
              <li key={evento.id}>

                <div>
                  <strong
                    className="enlace-evento"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSeleccionado(evento)}
                  >
                    {evento.nombre}
                  </strong>

                  <p className="helper-text">
                    {fechaCL(evento.fecha)}
                    {' · '}
                    {pesos(evento.presupuesto)}
                  </p>

                  <p className="helper-text">
                    Cliente:{' '}
                    {evento.cliente?.nombre || 'Sin cliente'}
                  </p>
                </div>

                <div className="presupuesto-actions">

                  <span
                    className={`status ${estadoClase(
                      evento.estadoPresupuesto
                    )}`}
                  >
                    {estadoTexto(evento.estadoPresupuesto)}
                  </span>

                  {esGerente && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => eliminarEvento(evento)}
                    >
                      Eliminar
                    </button>
                  )}

                </div>

              </li>
            ))}

          </ul>
        )}

      </section>

      {seleccionado && (
        <section className="panel">

          <div className="page-heading">
            <h2>Detalle: {seleccionado.nombre}</h2>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setSeleccionado(null)}
            >
              Cerrar detalle
            </button>
          </div>

          <p>
            <strong>Fecha:</strong>{' '}
            {fechaCL(seleccionado.fecha)}
          </p>

          <p>
            <strong>Cliente:</strong>{' '}
            {seleccionado.cliente?.nombre || 'Sin cliente'}
          </p>

          <p>
            <strong>Lugar:</strong>{' '}
            {seleccionado.lugar?.nombre || 'Sin lugar'}
          </p>

          <p>
            <strong>Invitados:</strong>{' '}
            {seleccionado.numInvitados ?? 'No registrado'}
          </p>

          <p>
            <strong>Presupuesto:</strong>{' '}
            {pesos(seleccionado.presupuesto)}
          </p>

          <p>
            <strong>Estado del presupuesto:</strong>{' '}
            <span
              className={`status ${estadoClase(
                seleccionado.estadoPresupuesto
              )}`}
            >
              {estadoTexto(seleccionado.estadoPresupuesto)}
            </span>
          </p>

          <p>
            <strong>Confirmación:</strong>{' '}
            {seleccionado.confirmado
              ? 'Confirmado'
              : 'Sin confirmar'}
          </p>

          {Array.isArray(seleccionado.detallesCotizacion) &&
            seleccionado.detallesCotizacion.length > 0 && (
              <div className="cotizacion-desglose">
                <h3>Equipos cotizados</h3>

                <ul>
                  {seleccionado.detallesCotizacion.map(item => (
                    <li key={item.id}>
                      {item.nombreEquipo}
                      {' — '}
                      {item.cantidad} unidad(es)
                      {' × '}
                      {item.diasArriendo} día(s)
                      {' — '}
                      {pesos(item.subtotal)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {esGerente &&
            seleccionado.estadoPresupuesto === 'APROBADO' && (
              <>
                <CancelacionEvento
                  evento={seleccionado}
                  onActualizado={actualizarEvento}
                />

                <FinalizacionEvento
                  evento={seleccionado}
                  onActualizado={actualizarEvento}
                />
              </>
            )}

        </section>
      )}

      {mostrarModal && (
        <CotizarEvento
          onCancelar={() => setMostrarModal(false)}
          onGuardado={cotizacionGuardada}
        />
      )}

    </div>
  );
}