import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import {
  CATEGORIAS,
  ESTADOS_STOCK,
  etiquetaCategoria,
  formatearPrecio,
  hoyISO,
} from './equiposConstantes';

const FORM_VACIO = {
  nombre: '',
  categoria: 'SONIDO',
  descripcion: '',
  cantidadTotal: '',
  cantidadMantencion: '',
  precioArriendoDia: '',
};

function formDesdeEquipo(e) {
  return {
    nombre: e.nombre,
    categoria: e.categoria,
    descripcion: e.descripcion ?? '',
    cantidadTotal: String(e.cantidadTotal),
    cantidadMantencion: String(e.cantidadMantencion),
    precioArriendoDia: e.precioArriendoDia != null ? String(e.precioArriendoDia) : '',
  };
}

function FormularioEquipo({ equipo, onGuardado, onCancelar }) {
  const [form, setForm] = useState(equipo ? formDesdeEquipo(equipo) : FORM_VACIO);
  const [error, setError] = useState(null);
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    const body = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      descripcion: form.descripcion,
      cantidadTotal: Number(form.cantidadTotal),
      cantidadMantencion: form.cantidadMantencion === '' ? 0 : Number(form.cantidadMantencion),
      precioArriendoDia: form.precioArriendoDia === '' ? '' : Number(form.precioArriendoDia),
    };
    try {
      await apiFetch(equipo ? `/equipos/${equipo.id}` : '/equipos', {
        method: equipo ? 'PUT' : 'POST',
        body,
      });
      onGuardado(equipo ? 'Equipo actualizado.' : 'Equipo agregado al inventario.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="panel">
      <h2>{equipo ? 'Editar equipo' : 'Nuevo equipo'}</h2>
      {error && <div className="pers-alert error">{error}</div>}
      <form onSubmit={guardar}>
        <div className="grid-2">
          <div className="campo">
            <label>Nombre *</label>
            <input required value={form.nombre} onChange={cambiar('nombre')} placeholder='Ej: Parlante activo 15"' />
          </div>
          <div className="campo">
            <label>Categoría *</label>
            <select value={form.categoria} onChange={cambiar('categoria')}>
              {CATEGORIAS.map((c) => (
                <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="campo">
          <label>Descripción</label>
          <input value={form.descripcion} onChange={cambiar('descripcion')} placeholder="Marca, modelo o detalles útiles" />
        </div>

        <div className="grid-2">
          <div className="campo">
            <label>Cantidad total *</label>
            <input required type="number" min="1" value={form.cantidadTotal} onChange={cambiar('cantidadTotal')} />
          </div>
          <div className="campo">
            <label>Unidades en mantención</label>
            <input type="number" min="0" value={form.cantidadMantencion} onChange={cambiar('cantidadMantencion')} placeholder="0" />
            <span className="ayuda">Las unidades en mantención no se pueden reservar.</span>
          </div>
        </div>

        <div className="campo">
          <label>Precio de arriendo por día (CLP)</label>
          <input type="number" min="0" value={form.precioArriendoDia} onChange={cambiar('precioArriendoDia')} placeholder="Opcional" />
        </div>

        <div className="acciones">
          <button type="submit" className="btn">{equipo ? 'Guardar cambios' : 'Agregar equipo'}</button>
          <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        </div>
      </form>
    </section>
  );
}

function InventarioEquipos() {
  const [fecha, setFecha] = useState(hoyISO());
  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [editando, setEditando] = useState(null); // null | 'nuevo' | equipo
  const [aviso, setAviso] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    apiFetch(`/equipos?fecha=${fecha || hoyISO()}`)
      .then((datos) => activo && setEquipos(datos))
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, [fecha, version]);

  const recargar = () => setVersion((v) => v + 1);

  const eliminar = async (e) => {
    const confirmado = window.confirm(
      `¿Eliminar "${e.nombre}"?\n\nSi ya se usó en eventos no se borra: queda desactivado y conserva su historial.`
    );
    if (!confirmado) return;
    setAviso(null);
    try {
      const resultado = await apiFetch(`/equipos/${e.id}`, { method: 'DELETE' });
      setAviso({ tipo: 'ok', texto: resultado.mensaje });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  const reactivar = async (e) => {
    setAviso(null);
    try {
      await apiFetch(`/equipos/${e.id}`, { method: 'PUT', body: { activo: true } });
      setAviso({ tipo: 'ok', texto: `"${e.nombre}" fue reactivado.` });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  if (editando) {
    return (
      <FormularioEquipo
        equipo={editando === 'nuevo' ? null : editando}
        onCancelar={() => setEditando(null)}
        onGuardado={(texto) => {
          setEditando(null);
          setAviso({ tipo: 'ok', texto });
          recargar();
        }}
      />
    );
  }

  const activos = equipos.filter((e) => e.activo);
  const texto = busqueda.trim().toLowerCase();
  const visibles = equipos.filter(
    (e) => (!categoria || e.categoria === categoria) && (!texto || e.nombre.toLowerCase().includes(texto))
  );

  const resumen = [
    { etiqueta: 'Tipos de equipo', valor: activos.length },
    { etiqueta: 'Unidades en total', valor: activos.reduce((s, e) => s + e.cantidadTotal, 0) },
    { etiqueta: 'En mantención', valor: activos.reduce((s, e) => s + e.cantidadMantencion, 0), clase: 'alerta' },
    { etiqueta: 'Reservadas ese día', valor: activos.reduce((s, e) => s + e.reservadoDia, 0), clase: 'destacado' },
  ];

  return (
    <section className="panel">
      <div className="pers-head">
        <h2>Inventario de equipos</h2>
        <button className="btn" onClick={() => { setAviso(null); setEditando('nuevo'); }}>+ Nuevo equipo</button>
      </div>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="stats-equipos">
        {resumen.map((r) => (
          <div key={r.etiqueta} className={`stat-equipo ${r.clase ?? ''}`}>
            <span>{r.etiqueta}</span>
            <strong>{r.valor}</strong>
          </div>
        ))}
      </div>

      <div className="filtros-equipos">
        <div className="campo buscar">
          <label>Buscar equipo</label>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej: parlante, mesa, carpa" />
        </div>
        <div className="campo">
          <label>Ver disponibilidad del día</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>

      <div className="chips" style={{ marginBottom: 16 }}>
        <button className={`chip ${categoria === '' ? 'activo' : ''}`} onClick={() => setCategoria('')}>Todos</button>
        {CATEGORIAS.map((c) => (
          <button key={c.valor} className={`chip ${categoria === c.valor ? 'activo' : ''}`} onClick={() => setCategoria(c.valor)}>
            {c.etiqueta}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="pers-vacio">
          {equipos.length === 0 ? 'Aún no hay equipos en el inventario.' : 'Ningún equipo coincide con los filtros.'}
        </p>
      ) : (
        visibles.map((e) => {
          const estado = ESTADOS_STOCK[e.estadoStock] ?? ESTADOS_STOCK.DISPONIBLE;
          const pct = (n) => `${Math.min(100, (n / e.cantidadTotal) * 100)}%`;
          return (
            <div key={e.id} className={`fila-equipo ${e.activo ? '' : 'inactivo'}`}>
              <div>
                <div className="principal">{e.nombre}</div>
                <div className="meta">
                  {etiquetaCategoria(e.categoria)} · Total {e.cantidadTotal}
                  {e.precioArriendoDia != null && ` · ${formatearPrecio(e.precioArriendoDia)}/día`}
                </div>
                {e.descripcion && <div className="meta">{e.descripcion}</div>}
              </div>

              <div>
                <div className="barra-stock" aria-hidden="true">
                  <div className="reservado" style={{ width: pct(e.reservadoDia) }} />
                  <div className="mantencion" style={{ width: pct(e.cantidadMantencion) }} />
                </div>
                <div className="stock-texto">
                  <strong>{e.disponible}</strong> disponibles · {e.reservadoDia} reservadas
                  {e.cantidadMantencion > 0 && ` · ${e.cantidadMantencion} en mantención`}
                </div>
              </div>

              <div className="acciones-col">
                <span className={`status ${estado.clase}`}>{estado.texto}</span>
                <div className="acciones">
                  {e.activo ? (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setAviso(null); setEditando(e); }}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(e)}>Eliminar</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => reactivar(e)}>Reactivar</button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      <p className="ayuda" style={{ marginTop: 16 }}>
        <span style={{ color: 'var(--cue)' }}>■</span> reservado ese día ·{' '}
        <span style={{ color: 'var(--cancel)' }}>■</span> en mantención. Los equipos con historial no se borran: se desactivan.
      </p>
    </section>
  );
}

export default InventarioEquipos;
