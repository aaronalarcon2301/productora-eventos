import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import {
  ROLES,
  TALLAS,
  DIAS,
  TURNOS,
  TIPOS_CUENTA,
  BANCOS,
  etiquetaRol,
  estadoTrabajador,
  resumenDisponibilidad,
} from './personalConstantes';

const FORM_VACIO = {
  nombre: '',
  rut: '',
  email: '',
  telefono: '',
  comuna: '',
  rolPrincipal: 'GARZON',
  aniosExperiencia: '',
  disponibilidadDias: [],
  disponibilidadTurno: '',
  tallaUniforme: '',
  banco: '',
  tipoCuenta: '',
  numeroCuenta: '',
};

function formDesdeTrabajador(t) {
  return {
    nombre: t.nombre ?? '',
    rut: t.rut ?? '',
    email: t.email ?? '',
    telefono: t.telefono ?? '',
    comuna: t.comuna ?? '',
    rolPrincipal: t.rolPrincipal,
    aniosExperiencia: t.aniosExperiencia ?? '',
    disponibilidadDias: t.disponibilidadDias ?? [],
    disponibilidadTurno: t.disponibilidadTurno ?? '',
    tallaUniforme: t.tallaUniforme ?? '',
    banco: t.banco ?? '',
    tipoCuenta: t.tipoCuenta ?? '',
    numeroCuenta: t.numeroCuenta ?? '',
  };
}

function iniciales(nombre) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

function Campo({ etiqueta, requerido, ayuda, children }) {
  return (
    <div className="campo">
      <label>
        {etiqueta}
        {requerido && ' *'}
      </label>
      {children}
      {ayuda && <span className="ayuda">{ayuda}</span>}
    </div>
  );
}

function FormularioTrabajador({ trabajador, onGuardado, onCancelar }) {
  const [form, setForm] = useState(trabajador ? formDesdeTrabajador(trabajador) : FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const alternarDia = (dia) => {
    const dias = form.disponibilidadDias.includes(dia)
      ? form.disponibilidadDias.filter((d) => d !== dia)
      : [...form.disponibilidadDias, dia];
    setForm({ ...form, disponibilidadDias: dias });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const body = {
      ...form,
      aniosExperiencia: form.aniosExperiencia === '' ? null : Number(form.aniosExperiencia),
    };
    try {
      const guardado = trabajador
        ? await apiFetch(`/trabajadores/${trabajador.id}`, { method: 'PUT', body })
        : await apiFetch('/trabajadores', { method: 'POST', body });
      onGuardado(guardado, Boolean(trabajador));
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="panel">
      <h2>{trabajador ? `Editar a ${trabajador.nombre}` : 'Registrar trabajador'}</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="pers-alert error">{error}</div>}
        <p className="ayuda" style={{ marginTop: 0 }}>Los campos con * son obligatorios.</p>

        <h3 className="form-seccion">1. Datos personales</h3>
        <Campo etiqueta="Nombre completo" requerido>
          <input required value={form.nombre} onChange={cambiar('nombre')} placeholder="Ej: María González Soto" />
        </Campo>
        <div className="grid-2">
          <Campo etiqueta="RUT" requerido ayuda="Con o sin puntos. Se valida el dígito verificador.">
            <input required value={form.rut} onChange={cambiar('rut')} placeholder="12.345.678-5" />
          </Campo>
          <Campo etiqueta="Teléfono" requerido>
            <input required value={form.telefono} onChange={cambiar('telefono')} placeholder="+56 9 1234 5678" />
          </Campo>
        </div>
        <div className="grid-2">
          <Campo etiqueta="Correo electrónico" requerido>
            <input required type="email" value={form.email} onChange={cambiar('email')} placeholder="nombre@correo.cl" />
          </Campo>
          <Campo etiqueta="Comuna">
            <input value={form.comuna} onChange={cambiar('comuna')} placeholder="Ej: Concepción" />
          </Campo>
        </div>

        <h3 className="form-seccion">2. Información laboral</h3>
        <div className="grid-2">
          <Campo etiqueta="Cargo principal" requerido>
            <select value={form.rolPrincipal} onChange={cambiar('rolPrincipal')}>
              {ROLES.map((r) => (
                <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Años de experiencia">
            <input type="number" min="0" max="60" value={form.aniosExperiencia} onChange={cambiar('aniosExperiencia')} placeholder="Ej: 3" />
          </Campo>
        </div>
        <Campo etiqueta="Disponibilidad semanal" ayuda="Marca los días en que suele poder trabajar.">
          <div className="chips" role="group" aria-label="Días disponibles">
            {DIAS.map((d) => (
              <button
                type="button"
                key={d.valor}
                className={`chip ${form.disponibilidadDias.includes(d.valor) ? 'activo' : ''}`}
                onClick={() => alternarDia(d.valor)}
              >
                {d.corto}
              </button>
            ))}
          </div>
        </Campo>
        <Campo etiqueta="Turno">
          <select value={form.disponibilidadTurno} onChange={cambiar('disponibilidadTurno')}>
            <option value="">Sin definir</option>
            {TURNOS.map((t) => (
              <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
            ))}
          </select>
        </Campo>

        <h3 className="form-seccion">3. Información administrativa</h3>
        <Campo etiqueta="Talla de uniforme">
          <select value={form.tallaUniforme} onChange={cambiar('tallaUniforme')}>
            <option value="">Sin definir</option>
            {TALLAS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Datos bancarios" ayuda="Opcionales, pero si ingresas uno debes completar los tres. En los listados solo se muestran los últimos 4 dígitos.">
          <div className="grid-2">
            <select value={form.banco} onChange={cambiar('banco')}>
              <option value="">Banco…</option>
              {BANCOS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select value={form.tipoCuenta} onChange={cambiar('tipoCuenta')}>
              <option value="">Tipo de cuenta…</option>
              {TIPOS_CUENTA.map((t) => (
                <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
              ))}
            </select>
          </div>
          <input value={form.numeroCuenta} onChange={cambiar('numeroCuenta')} placeholder="Número de cuenta" inputMode="numeric" />
        </Campo>

        <div className="acciones" style={{ marginTop: 20 }}>
          <button type="submit" className="btn" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function TrabajadorList({ onEvaluar, onHistorial }) {
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [editando, setEditando] = useState(null); // null | 'nuevo' | trabajador completo
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    apiFetch('/trabajadores')
      .then((datos) => {
        if (!activo) return;
        setTrabajadores(datos);
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

  const recargar = () => setVersion((v) => v + 1);

  const handleGuardado = (trabajador, fueEdicion) => {
    setEditando(null);
    setAviso({ tipo: 'ok', texto: fueEdicion ? 'Trabajador actualizado.' : 'Trabajador registrado.' });
    recargar();
  };

  // El listado no trae el número de cuenta completo: se pide la ficha completa al editar.
  const editar = async (t) => {
    setAviso(null);
    try {
      setEditando(await apiFetch(`/trabajadores/${t.id}`));
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  const eliminar = async (t) => {
    const confirmado = window.confirm(
      `¿Eliminar a ${t.nombre}?\n\nSi ya tiene evaluaciones, incidentes o asignaciones no se borrará: quedará como inactivo y conservará su historial.`
    );
    if (!confirmado) return;
    try {
      const resultado = await apiFetch(`/trabajadores/${t.id}`, { method: 'DELETE' });
      setAviso({ tipo: 'ok', texto: resultado.mensaje });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  const reactivar = async (t) => {
    try {
      await apiFetch(`/trabajadores/${t.id}`, { method: 'PUT', body: { activo: true } });
      setAviso({ tipo: 'ok', texto: `${t.nombre} fue reactivado.` });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  const termino = busqueda.trim().toLowerCase();
  const filtrados = trabajadores.filter(
    (t) => t.nombre.toLowerCase().includes(termino) || (t.rut ?? '').toLowerCase().includes(termino)
  );
  const fichaIncompleta = (t) => !t.rut || !t.email || !t.telefono;

  if (editando) {
    return (
      <FormularioTrabajador
        trabajador={editando === 'nuevo' ? null : editando}
        onGuardado={handleGuardado}
        onCancelar={() => setEditando(null)}
      />
    );
  }

  const activos = trabajadores.filter((t) => t.activo && !t.bloqueado);
  const conNota = trabajadores.filter((t) => t.promedioGeneral != null);
  const promedioEquipo = conNota.length
    ? (conNota.reduce((s, t) => s + t.promedioGeneral, 0) / conNota.length).toFixed(1)
    : '—';
  const resumen = [
    { etiqueta: 'Trabajadores', valor: trabajadores.length },
    { etiqueta: 'Activos', valor: activos.length, clase: 'ok' },
    { etiqueta: 'Bloqueados o inactivos', valor: trabajadores.length - activos.length, clase: 'alerta' },
    { etiqueta: 'Promedio del equipo', valor: promedioEquipo, clase: 'destacado' },
  ];
  const visibles = filtrados.filter((t) => {
    if (filtroEstado === 'activos') return t.activo && !t.bloqueado;
    if (filtroEstado === 'otros') return !t.activo || t.bloqueado;
    return true;
  });

  return (
    <section className="pagina-seccion">
      <div className="pers-head">
        <div>
          <h2 className="titulo-seccion">Trabajadores eventuales</h2>
          <p className="subtitulo">Personal disponible para asignar a los eventos.</p>
        </div>
        <button className="btn" onClick={() => { setAviso(null); setEditando('nuevo'); }}>+ Nuevo trabajador</button>
      </div>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

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
          placeholder="Buscar por nombre o RUT…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="chips">
          {[['todos', 'Todos'], ['activos', 'Activos'], ['otros', 'Bloqueados / inactivos']].map(([valor, texto]) => (
            <button key={valor} className={`chip ${filtroEstado === valor ? 'activo' : ''}`} onClick={() => setFiltroEstado(valor)}>
              {texto}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <p className="pers-vacio">Cargando trabajadores…</p>
      ) : visibles.length === 0 ? (
        <p className="pers-vacio">No hay trabajadores para mostrar.</p>
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
                  {fichaIncompleta(t) && <span className="status pending">Ficha incompleta</span>}
                </div>

                <dl className="tarjeta-datos">
                  {t.telefono && (<><dt>Teléfono</dt><dd>{t.telefono}</dd></>)}
                  {t.comuna && (<><dt>Comuna</dt><dd>{t.comuna}</dd></>)}
                  {t.rut && (<><dt>RUT</dt><dd>{t.rut}</dd></>)}
                  {t.numeroCuentaUltimos4 && (<><dt>Cuenta</dt><dd>•••• {t.numeroCuentaUltimos4}</dd></>)}
                </dl>

                <div className="dias-semana" title={resumenDisponibilidad(t)}>
                  {DIAS.map((d) => (
                    <span key={d.valor} className={t.disponibilidadDias?.includes(d.valor) ? 'si' : ''}>
                      {d.corto.charAt(0)}
                    </span>
                  ))}
                  <small>{TURNOS.find((x) => x.valor === t.disponibilidadTurno)?.etiqueta ?? 'Turno sin definir'}</small>
                </div>

                <div className="tarjeta-pie">
                  <div className="acciones">
                    <button className="btn btn-sm" onClick={() => onHistorial(t.id)}>Historial</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onEvaluar(t.id)}>Evaluar</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => editar(t)}>Editar</button>
                    {!t.activo && <button className="btn btn-ghost btn-sm" onClick={() => reactivar(t)}>Reactivar</button>}
                  </div>
                  <button className="link-peligro" onClick={() => eliminar(t)}>Eliminar</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default TrabajadorList;
