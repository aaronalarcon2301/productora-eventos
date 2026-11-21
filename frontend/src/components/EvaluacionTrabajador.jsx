import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import FormularioEvaluacion from './FormularioEvaluacion';
import { etiquetaRol, formatearFecha, estadoTrabajador } from './personalConstantes';

const sinTildes = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

function iniciales(nombre) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

// Todo el personal en pantalla; el buscador filtra solo por nombre o cargo.
function ElegirTrabajador({ trabajadores, cargando, aviso, onElegir }) {
  const [busqueda, setBusqueda] = useState('');
  const termino = sinTildes(busqueda);
  const visibles = trabajadores.filter(
    (t) => sinTildes(t.nombre).includes(termino) || sinTildes(etiquetaRol(t.rolPrincipal)).includes(termino)
  );

  return (
    <section className="pagina-seccion">
      <div className="pers-head">
        <div>
          <h2 className="titulo-seccion">Evaluación de personal</h2>
          <p className="subtitulo">Elige a quién quieres evaluar.</p>
        </div>
      </div>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="barra-filtros">
        <input
          className="buscar"
          placeholder="Buscar por nombre o cargo…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {cargando ? (
        <p className="pers-vacio">Cargando trabajadores…</p>
      ) : visibles.length === 0 ? (
        <p className="pers-vacio">No hay trabajadores que coincidan con la búsqueda.</p>
      ) : (
        <div className="grilla-tarjetas">
          {visibles.map((t) => {
            const estado = estadoTrabajador(t);
            return (
              <article key={t.id} className={`tarjeta ${t.activo && !t.bloqueado ? '' : 'apagada'}`}>
                <div className="tarjeta-cab">
                  <div className="avatar" aria-hidden="true">{iniciales(t.nombre)}</div>
                  <div className="tarjeta-titulo">
                    <h3>{t.nombre}</h3>
                    <span>{etiquetaRol(t.rolPrincipal)}</span>
                  </div>
                  <span className={`status ${estado.clase}`}>{estado.texto}</span>
                </div>

                <div className="nota-bloque">
                  {t.promedioGeneral != null ? (
                    <>
                      <span className="nota-valor">★ {t.promedioGeneral.toFixed(1)}</span>
                      <span className="nota-barra"><i style={{ width: `${(t.promedioGeneral / 5) * 100}%` }} /></span>
                    </>
                  ) : (
                    <span className="sin-nota">Sin evaluaciones aún</span>
                  )}
                </div>

                <div className="tarjeta-pie">
                  <div className="acciones">
                    <button className="btn btn-sm" onClick={() => onElegir(t.id)}>Evaluar</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function estadoAsignacion(a) {
  if (a.evaluada) return { texto: 'Evaluado', clase: 'confirmed' };
  if (a.evento.cancelado) return { texto: 'Evento cancelado', clase: 'cancelled' };
  if (!a.finalizado) return { texto: 'Aún no finaliza', clase: 'pending' };
  return { texto: 'Pendiente de evaluar', clase: 'pending' };
}

function EvaluacionTrabajador({ trabajadorId, setTrabajadorId, onVerHistorial }) {
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargandoTrabajadores, setCargandoTrabajadores] = useState(true);
  const [cargadas, setCargadas] = useState({ id: null, datos: [] });
  const [evaluando, setEvaluando] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    apiFetch('/trabajadores')
      .then((datos) => {
        if (!activo) return;
        setTrabajadores(datos);
        setCargandoTrabajadores(false);
      })
      .catch((err) => {
        if (!activo) return;
        setAviso({ tipo: 'error', texto: err.message });
        setCargandoTrabajadores(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!trabajadorId) return;
    let activo = true;
    apiFetch(`/asignaciones/trabajador/${trabajadorId}`)
      .then((datos) => activo && setCargadas({ id: String(trabajadorId), datos }))
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, [trabajadorId, version]);

  const trabajador = trabajadores.find((t) => String(t.id) === String(trabajadorId));
  const asignacionesListas = cargadas.id === String(trabajadorId);
  const lista = asignacionesListas ? cargadas.datos : [];

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

  if (!trabajadorId) {
    return (
      <ElegirTrabajador
        trabajadores={trabajadores}
        cargando={cargandoTrabajadores}
        aviso={aviso}
        onElegir={(id) => {
          setAviso(null);
          setTrabajadorId(String(id));
        }}
      />
    );
  }

  return (
    <section className="panel">
      <h2>Evaluación de personal</h2>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="elegido">
        <div>
          <div className="principal">{trabajador?.nombre ?? 'Cargando…'}</div>
          {trabajador && <div className="meta">{etiquetaRol(trabajador.rolPrincipal)}</div>}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setAviso(null);
            setTrabajadorId('');
          }}
        >
          ← Cambiar trabajador
        </button>
      </div>

      {trabajador?.bloqueado && (
        <div className="pers-alert error">
          Este trabajador está bloqueado por una falta grave y no puede recibir nuevas evaluaciones.
        </div>
      )}

      {trabajadorId && (
        <>
          <h3 className="seccion-titulo">Eventos en los que participó</h3>
          {!asignacionesListas ? (
            <p className="pers-vacio">Cargando eventos…</p>
          ) : lista.length === 0 ? (
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
