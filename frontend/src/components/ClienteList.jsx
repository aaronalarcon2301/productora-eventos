import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import { formatearFecha } from './personalConstantes';
import { iniciales } from './clientesUtil';
import FormularioCliente from './FormularioCliente';
import FichaCliente from './FichaCliente';
import './personal.css';
import './clientes.css';

const FILTROS = [
  ['todos', 'Todos'],
  ['frecuentes', 'Frecuentes'],
  ['incompletos', 'Por completar'],
  ['sin-eventos', 'Sin eventos'],
];

const vigentes = (c) => c.eventos.filter((e) => !e.cancelado);
const esFrecuente = (c) => vigentes(c).length >= 3;
const datosIncompletos = (c) => !c.rut || !c.email || !c.telefono;

function proximoEvento(c) {
  const hoy = new Date();
  const inicioHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return vigentes(c)
    .filter((e) => new Date(e.fecha).getTime() >= inicioHoy)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];
}

function ClienteList() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [vista, setVista] = useState({ tipo: 'lista' });
  const [aviso, setAviso] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    apiFetch('/clientes')
      .then((datos) => {
        if (!activo) return;
        setClientes(datos);
        setCargando(false);
      })
      .catch((err) => {
        if (!activo) return;
        setErrorCarga(err.message);
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [version]);

  const recargar = () => setVersion((v) => v + 1);
  const volverALista = () => setVista({ tipo: 'lista' });

  const eliminar = async (c) => {
    if (!window.confirm(`¿Eliminar a "${c.nombre}"?`)) return;
    setAviso(null);
    try {
      await apiFetch(`/clientes/${c.id}`, { method: 'DELETE' });
      setAviso({ tipo: 'ok', texto: `"${c.nombre}" fue eliminado.` });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  if (vista.tipo === 'form') {
    return (
      <div className="pagina">
        <FormularioCliente
          cliente={vista.cliente}
          onCancelar={volverALista}
          onGuardado={(texto) => {
            setAviso({ tipo: 'ok', texto });
            volverALista();
            recargar();
          }}
        />
      </div>
    );
  }

  if (vista.tipo === 'ficha') {
    return (
      <div className="pagina">
        <FichaCliente
          id={vista.id}
          onVolver={() => {
            volverALista();
            recargar();
          }}
          onEditar={(cliente) => setVista({ tipo: 'form', cliente })}
        />
      </div>
    );
  }

  const termino = busqueda.trim().toLowerCase();
  const visibles = clientes.filter((c) => {
    const coincide =
      !termino ||
      [c.nombre, c.rut, c.email, c.telefono].some((campo) => (campo ?? '').toLowerCase().includes(termino));
    if (!coincide) return false;
    if (filtro === 'frecuentes') return esFrecuente(c);
    if (filtro === 'incompletos') return datosIncompletos(c);
    if (filtro === 'sin-eventos') return c.eventos.length === 0;
    return true;
  });

  const resumen = [
    { etiqueta: 'Clientes', valor: clientes.length },
    { etiqueta: 'Frecuentes', valor: clientes.filter(esFrecuente).length, clase: 'ok' },
    { etiqueta: 'Con datos por completar', valor: clientes.filter(datosIncompletos).length, clase: 'destacado' },
    { etiqueta: 'Sin eventos', valor: clientes.filter((c) => c.eventos.length === 0).length },
  ];

  return (
    <div className="pagina">
      <header className="pagina-cab">
        <h1>Clientes</h1>
        <p>Datos de contacto e historial de cada cliente de la productora.</p>
      </header>

      <section className="pagina-seccion">
        <div className="pers-head">
          <div />
          <button className="btn" onClick={() => { setAviso(null); setVista({ tipo: 'form', cliente: null }); }}>
            + Nuevo cliente
          </button>
        </div>

        {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}
        {errorCarga && <div className="pers-alert error">{errorCarga}</div>}

        <div className="stats">
          {resumen.map((r) => (
            <div key={r.etiqueta} className={`stat ${r.clase ?? ''}`}>
              <span>{r.etiqueta}</span>
              <strong>{r.valor}</strong>
            </div>
          ))}
        </div>

        <div className="barra-filtros">
          <input
            className="buscar"
            placeholder="Buscar por nombre, RUT, email o teléfono…"
            aria-label="Buscar cliente"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="chips">
            {FILTROS.map(([valor, texto]) => (
              <button key={valor} className={`chip ${filtro === valor ? 'activo' : ''}`} onClick={() => setFiltro(valor)}>
                {texto}
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <p className="pers-vacio">Cargando clientes…</p>
        ) : visibles.length === 0 ? (
          <p className="estado-vacio">
            {clientes.length === 0 ? 'Todavía no hay clientes registrados.' : 'Ningún cliente coincide con la búsqueda.'}
          </p>
        ) : (
          <div className="grilla-tarjetas">
            {visibles.map((c) => {
              const proximo = proximoEvento(c);
              const n = vigentes(c).length;
              return (
                <article key={c.id} className="tarjeta">
                  <div className="tarjeta-cab">
                    <div className="avatar" aria-hidden="true">{iniciales(c.nombre)}</div>
                    <div className="tarjeta-titulo">
                      <h3>{c.nombre}</h3>
                      <span>{n === 0 ? 'Sin eventos' : `${n} evento${n === 1 ? '' : 's'}`}</span>
                    </div>
                    {esFrecuente(c) && <span className="status confirmed">Frecuente</span>}
                  </div>

                  <dl className="tarjeta-datos">
                    <dt>RUT</dt>
                    <dd className={c.rut ? '' : 'falta'}>{c.rut ?? 'Falta RUT'}</dd>
                    <dt>Email</dt>
                    <dd className={c.email ? '' : 'falta'}>{c.email ?? 'Falta email'}</dd>
                    <dt>Teléfono</dt>
                    <dd className={c.telefono ? '' : 'falta'}>{c.telefono ?? 'Falta teléfono'}</dd>
                    <dt>Próximo</dt>
                    <dd>{proximo ? `${proximo.nombre}, ${formatearFecha(proximo.fecha)}` : 'Sin eventos próximos'}</dd>
                  </dl>

                  <div className="tarjeta-pie">
                    <div className="acciones">
                      <button className="btn btn-sm" onClick={() => setVista({ tipo: 'ficha', id: c.id })}>Ver ficha</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setAviso(null); setVista({ tipo: 'form', cliente: c }); }}>
                        Editar
                      </button>
                    </div>
                    <button className="link-peligro" onClick={() => eliminar(c)}>Eliminar</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default ClienteList;
