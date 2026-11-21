import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/apiFetch';
import './ReclamosGestion.css';

const TIPOS = {
  OPINION: 'Opinión',
  SUGERENCIA: 'Sugerencia',
  RECLAMO: 'Reclamo'
};

const CATEGORIAS = {
  EQUIPAMIENTO: 'Equipamiento',
  PERSONAL_ATENCION: 'Personal y atención',
  COBROS_PAGOS: 'Cobros y pagos',
  MONTAJE_LOGISTICA: 'Montaje y logística',
  OTROS: 'Otros'
};

const AREAS = {
  AREA_TECNICA: 'Área técnica',
  OPERACIONES: 'Operaciones',
  ADMINISTRACION: 'Administración',
  LOGISTICA: 'Logística',
  ATENCION_CLIENTE: 'Atención al cliente'
};

const AREAS_POR_CATEGORIA = {
  EQUIPAMIENTO: 'AREA_TECNICA',
  PERSONAL_ATENCION: 'OPERACIONES',
  COBROS_PAGOS: 'ADMINISTRACION',
  MONTAJE_LOGISTICA: 'LOGISTICA',
  OTROS: 'ATENCION_CLIENTE'
};

const ESTADOS = {
  RECIBIDA: 'Recibida',
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revisión',
  RESUELTO: 'Resuelto'
};

const tipoDe = reclamo => reclamo.tipoFeedback || 'RECLAMO';
const esOpinion = reclamo => tipoDe(reclamo) === 'OPINION';
const estadoVisible = reclamo => esOpinion(reclamo) ? 'RECIBIDA' : reclamo.estado;

function textoBusqueda(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function Estrellas({ valor }) {
  const numero = Math.max(0, Math.min(5, Number(valor) || 0));
  return (
    <span className="rg-estrellas" aria-label={`${numero} de 5 estrellas`}>
      {'★'.repeat(numero)}<span className="rg-estrellas-vacias">{'☆'.repeat(5 - numero)}</span>
      <span className="rg-nota">{numero}/5</span>
    </span>
  );
}

export default function ReclamosGestion({ rol }) {
  const esGerente = rol === 'GERENTE';

  const [reclamos, setReclamos] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errorModal, setErrorModal] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [orden, setOrden] = useState('recientes');

  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState(null);

  async function cargarDatos() {
    setCargando(true);
    setError('');
    try {
      const [lista, usuarios] = await Promise.all([
        apiFetch('/reclamos-gestion'),
        esGerente ? apiFetch('/reclamos-gestion/responsables') : Promise.resolve([])
      ]);

      if (!Array.isArray(lista) || !Array.isArray(usuarios)) {
        throw new Error('El servidor devolvió un formato de datos inesperado.');
      }

      setReclamos(lista);
      setResponsables(usuarios);
    } catch (err) {
      setError(err.message || 'No fue posible cargar las respuestas.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, [rol]);

  useEffect(() => {
    if (!seleccionado) return;
    const alPresionar = e => {
      if (e.key === 'Escape' && !guardando) cerrarDetalle();
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [seleccionado, guardando]);

  function abrirDetalle(reclamo) {
    setSeleccionado(reclamo);
    setErrorModal('');
    setForm({
      categoria: reclamo.categoria || 'OTROS',
      responsableId: reclamo.responsableId == null ? '' : String(reclamo.responsableId),
      estado: reclamo.estado || 'PENDIENTE',
      respuesta: reclamo.respuesta || ''
    });
  }

  function cerrarDetalle() {
    if (guardando) return;
    setSeleccionado(null);
    setForm(null);
    setErrorModal('');
  }

  async function guardarGestion(e) {
    e.preventDefault();
    if (!seleccionado || !form || esOpinion(seleccionado)) return;

    if (form.estado === 'RESUELTO' && !form.respuesta.trim()) {
      setErrorModal('Debes escribir la solución antes de marcar el caso como resuelto.');
      return;
    }

    setGuardando(true);
    setErrorModal('');
    setMensaje('');

    const datos = {
      estado: form.estado,
      respuesta: form.respuesta.trim() || null
    };

    if (esGerente) {
      datos.categoria = form.categoria;
      datos.responsableId = form.responsableId ? Number(form.responsableId) : null;
    }

    try {
      await apiFetch(`/reclamos-gestion/${seleccionado.id}`, {
        method: 'PATCH',
        body: datos
      });
      setSeleccionado(null);
      setForm(null);
      setErrorModal('');
      await cargarDatos();
      setMensaje('La gestión del caso se guardó correctamente.');
    } catch (err) {
      setErrorModal(err.message || 'No fue posible guardar la gestión.');
    } finally {
      setGuardando(false);
    }
  }

  const resumen = useMemo(() => {
    const calificaciones = reclamos.map(r => Number(r.calificacion)).filter(Number.isFinite);
    const promedio = calificaciones.length
      ? (calificaciones.reduce((suma, n) => suma + n, 0) / calificaciones.length)
        .toFixed(1).replace('.', ',')
      : '—';

    return {
      total: reclamos.length,
      promedio,
      pendientes: reclamos.filter(r => !esOpinion(r) && r.estado !== 'RESUELTO').length,
      resueltos: reclamos.filter(r => !esOpinion(r) && r.estado === 'RESUELTO').length
    };
  }, [reclamos]);

  const cantidadPorTipo = tipo => reclamos.filter(r => tipoDe(r) === tipo).length;

  const visibles = useMemo(() => {
    const busquedaNormalizada = textoBusqueda(busqueda.trim());

    return reclamos.filter(reclamo => {
      if (filtroTipo && tipoDe(reclamo) !== filtroTipo) return false;
      if (filtroEstado && estadoVisible(reclamo) !== filtroEstado) return false;
      if (filtroCategoria && (esOpinion(reclamo) || reclamo.categoria !== filtroCategoria)) return false;

      const contenido = [
        reclamo.id,
        reclamo.autor,
        reclamo.evento?.nombre,
        reclamo.mensaje,
        TIPOS[tipoDe(reclamo)],
        CATEGORIAS[reclamo.categoria],
        AREAS[reclamo.areaResponsable],
        reclamo.responsable?.nombre
      ].map(textoBusqueda).join(' ');

      return contenido.includes(busquedaNormalizada);
    }).sort((a, b) => {
      if (orden === 'antiguos') return a.id - b.id;
      if (orden === 'mejores') return Number(b.calificacion) - Number(a.calificacion) || b.id - a.id;
      if (orden === 'peores') return Number(a.calificacion) - Number(b.calificacion) || b.id - a.id;
      return b.id - a.id;
    });
  }, [reclamos, busqueda, filtroTipo, filtroCategoria, filtroEstado, orden]);

  function limpiarFiltros() {
    setBusqueda('');
    setFiltroTipo('');
    setFiltroCategoria('');
    setFiltroEstado('');
    setOrden('recientes');
  }

  return (
    <div className="rg-page">
      <header className="rg-encabezado">
        <div>
          <h1>Opiniones y reclamos</h1>
          <p>{esGerente ? 'Satisfacción y seguimiento de las respuestas de clientes.' : 'Consulta y atención de tus casos asignados.'}</p>
        </div>
        <button type="button" className="rg-btn rg-btn-secundario" onClick={cargarDatos} disabled={cargando}>
          {cargando ? 'Actualizando...' : '↻ Actualizar'}
        </button>
      </header>

      {error && <div className="rg-alerta rg-alerta-error" role="alert">{error}</div>}
      {mensaje && <div className="rg-alerta rg-alerta-exito" role="status">{mensaje}</div>}

      <section className="rg-estadisticas" aria-label="Resumen de satisfacción">
        <article className="rg-indicador">
          <span>Respuestas recibidas</span>
          <strong>{resumen.total}</strong>
          <small>Opiniones, sugerencias y reclamos</small>
        </article>
        <article className="rg-indicador">
          <span>Calificación promedio</span>
          <strong>{resumen.promedio} <b className="rg-estrella-indicador">★</b></strong>
          <small>Sobre 5 estrellas</small>
        </article>
        <article className="rg-indicador">
          <span>Casos abiertos</span>
          <strong>{resumen.pendientes}</strong>
          <small>Sugerencias y reclamos</small>
        </article>
        <article className="rg-indicador">
          <span>Casos resueltos</span>
          <strong>{resumen.resueltos}</strong>
          <small>Con respuesta registrada</small>
        </article>
      </section>

      <section className="rg-panel">
        <div className="rg-panel-titulo">
          <h2>{esGerente ? 'Bandeja de respuestas' : 'Mis casos asignados'}</h2>
          <span>{visibles.length} resultado{visibles.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="rg-pestanas" aria-label="Filtrar por tipo">
          {[
            ['', 'Todas', reclamos.length],
            ['OPINION', 'Opiniones', cantidadPorTipo('OPINION')],
            ['SUGERENCIA', 'Sugerencias', cantidadPorTipo('SUGERENCIA')],
            ['RECLAMO', 'Reclamos', cantidadPorTipo('RECLAMO')]
          ].map(([valor, texto, cantidad]) => (
            <button
              type="button"
              key={valor}
              className={`rg-pestana ${filtroTipo === valor ? 'rg-pestana-activa' : ''}`}
              aria-pressed={filtroTipo === valor}
              onClick={() => setFiltroTipo(valor)}
            >
              {texto} <span>{cantidad}</span>
            </button>
          ))}
        </div>

        <div className="rg-filtros">
          <label className="rg-campo rg-buscador">
            <span>Buscar</span>
            <input
              type="search"
              placeholder="Cliente, evento, mensaje o N.º de caso..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </label>
          <label className="rg-campo">
            <span>Estado</span>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(ESTADOS).map(([valor, nombre]) => (
                <option key={valor} value={valor}>{nombre}</option>
              ))}
            </select>
          </label>
          <label className="rg-campo">
            <span>Categoría</span>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
              <option value="">Todas</option>
              {Object.entries(CATEGORIAS).map(([valor, nombre]) => (
                <option key={valor} value={valor}>{nombre}</option>
              ))}
            </select>
          </label>
          <label className="rg-campo">
            <span>Ordenar por</span>
            <select value={orden} onChange={e => setOrden(e.target.value)}>
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
              <option value="mejores">Más estrellas</option>
              <option value="peores">Menos estrellas</option>
            </select>
          </label>
        </div>

        <div className="rg-resultados">
          <span>Mostrando {visibles.length} de {reclamos.length} respuestas</span>
          <button type="button" onClick={limpiarFiltros} className="rg-enlace">Limpiar filtros</button>
        </div>

        {cargando && <p className="rg-vacio">Cargando respuestas...</p>}

        {!cargando && visibles.length === 0 && (
          <div className="rg-vacio">
            <strong>No encontramos respuestas con esos filtros.</strong>
            <p>Prueba con otra búsqueda o limpia los filtros.</p>
          </div>
        )}

        {!cargando && visibles.length > 0 && (
          <div className="rg-listado">
            {visibles.map(reclamo => {
              const tipo = tipoDe(reclamo);
              const opinion = esOpinion(reclamo);
              const estado = estadoVisible(reclamo);

              return (
                <article key={reclamo.id} className="rg-tarjeta">
                  <div className="rg-tarjeta-principal">
                    <div className="rg-etiquetas">
                      <span className={`rg-etiqueta rg-tipo-${tipo.toLowerCase()}`}>{TIPOS[tipo]}</span>
                      <span className={`rg-etiqueta rg-estado-${estado?.toLowerCase()}`}>{ESTADOS[estado] || estado}</span>
                      <span className="rg-numero">#{reclamo.id}</span>
                    </div>

                    <h3>{reclamo.evento?.nombre || 'Evento no disponible'}</h3>
                    <p className="rg-cliente">{reclamo.autor || 'Cliente sin nombre'}</p>
                    <p className="rg-comentario">{reclamo.mensaje}</p>

                    <div className="rg-detalles">
                      {opinion ? (
                        <span>Opinión recibida · No requiere asignación</span>
                      ) : (
                        <>
                          <span>{CATEGORIAS[reclamo.categoria] || 'Sin categoría'}</span>
                          <span>Área: {AREAS[reclamo.areaResponsable] || 'Sin definir'}</span>
                          <span>Responsable: {reclamo.responsable?.nombre || 'Sin asignar'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rg-tarjeta-lateral">
                    <Estrellas valor={reclamo.calificacion} />
                    <button type="button" className="rg-btn rg-btn-secundario" onClick={() => abrirDetalle(reclamo)}>
                      {opinion ? 'Ver opinión' : 'Gestionar'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {seleccionado && form && (
        <div className="rg-superposicion" onMouseDown={e => {
          if (e.target === e.currentTarget) cerrarDetalle();
        }}>
          <section className="rg-modal" role="dialog" aria-modal="true" aria-labelledby="rg-titulo-modal">
            <div className="rg-modal-cabecera">
              <div>
                <span className="rg-modal-subtitulo">{TIPOS[tipoDe(seleccionado)]} #{seleccionado.id}</span>
                <h2 id="rg-titulo-modal">{esOpinion(seleccionado) ? 'Detalle de la opinión' : 'Gestionar respuesta'}</h2>
              </div>
              <button type="button" className="rg-cerrar" onClick={cerrarDetalle} aria-label="Cerrar ventana" disabled={guardando}>×</button>
            </div>

            <div className="rg-modal-contenido">
              <div className="rg-detalle-resumen">
                <strong>{seleccionado.evento?.nombre || 'Evento'}</strong>
                <span>Cliente: {seleccionado.autor}</span>
                <Estrellas valor={seleccionado.calificacion} />
                <p>{seleccionado.mensaje}</p>
              </div>

              {esOpinion(seleccionado) ? (
                <>
                  <div className="rg-alerta rg-alerta-exito">
                    Esta opinión fue recibida correctamente. No necesita asignación ni resolución de un reclamo.
                  </div>
                  <div className="rg-acciones-modal">
                    <button type="button" className="rg-btn rg-btn-acento" onClick={cerrarDetalle}>Cerrar</button>
                  </div>
                </>
              ) : (
                <form onSubmit={guardarGestion}>
                  {errorModal && <div role="alert" className="rg-alerta rg-alerta-error">{errorModal}</div>}

                  {esGerente && (
                    <div className="rg-form-grid">
                      <label className="rg-campo">
                        <span>Categoría</span>
                        <select value={form.categoria} onChange={e => setForm(actual => ({
                          ...actual,
                          categoria: e.target.value,
                          responsableId: e.target.value === actual.categoria ? actual.responsableId : ''
                        }))}>
                          {Object.entries(CATEGORIAS).map(([valor, nombre]) => (
                            <option key={valor} value={valor}>{nombre}</option>
                          ))}
                        </select>
                      </label>
                      <label className="rg-campo">
                        <span>Responsable asignado</span>
                        <select value={form.responsableId} onChange={e => setForm(actual => ({ ...actual, responsableId: e.target.value }))}>
                          <option value="">Sin asignar</option>
                          {responsables.map(u => (
                            <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}

                  <p className="rg-area-derivada">
                    <strong>Área de atención:</strong>{' '}
                    {AREAS[AREAS_POR_CATEGORIA[form.categoria]]}
                    <span> · Se determina automáticamente por la categoría</span>
                  </p>

                  <label className="rg-campo rg-campo-separado">
                    <span>Estado de atención</span>
                    <select value={form.estado} onChange={e => setForm(actual => ({ ...actual, estado: e.target.value }))}>
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN_REVISION">En revisión</option>
                      <option value="RESUELTO">Resuelto</option>
                    </select>
                  </label>

                  <label className="rg-campo rg-campo-separado">
                    <span>Respuesta o solución</span>
                    <textarea
                      rows={4}
                      maxLength={2000}
                      placeholder="Describe las acciones realizadas para atender el caso..."
                      value={form.respuesta}
                      onChange={e => setForm(actual => ({ ...actual, respuesta: e.target.value }))}
                    />
                  </label>
                  <p className="rg-ayuda">Para marcar un caso como resuelto debes escribir una respuesta.</p>

                  <div className="rg-acciones-modal">
                    <button type="button" className="rg-btn rg-btn-secundario" onClick={cerrarDetalle} disabled={guardando}>Cancelar</button>
                    <button type="submit" className="rg-btn rg-btn-acento" disabled={guardando}>
                      {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
