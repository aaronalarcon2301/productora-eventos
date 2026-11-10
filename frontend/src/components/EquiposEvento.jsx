import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import { formatearFecha, etiquetaRol } from './personalConstantes';
import { ESTADOS_RESERVA, etiquetaCategoria } from './equiposConstantes';

const FORM_VACIO = { equipoId: '', cantidad: '1', responsableId: '' };

function EquiposEvento() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState('');
  const [reservas, setReservas] = useState([]);
  const [equipos, setEquipos] = useState([]); // con la disponibilidad en la fecha del evento
  const [asignados, setAsignados] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
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
    Promise.all([
      apiFetch(`/reservas-equipo/evento/${eventoId}`),
      apiFetch(`/equipos?eventoId=${eventoId}&soloActivos=true`),
      apiFetch(`/asignaciones/evento/${eventoId}`),
    ])
      .then(([res, eqs, asig]) => {
        if (!activo) return;
        setReservas(res);
        setEquipos(eqs);
        setAsignados(asig);
      })
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, [eventoId, version]);

  const recargar = () => setVersion((v) => v + 1);
  const evento = eventos.find((e) => String(e.id) === eventoId);
  const lista = eventoId ? reservas : [];
  const idsReservados = new Set(lista.map((r) => r.equipoId));
  const candidatos = equipos.filter((e) => !idsReservados.has(e.id));
  const responsables = asignados.filter((a) => a.trabajador.activo && !a.trabajador.bloqueado);

  const elegido = equipos.find((e) => String(e.id) === form.equipoId);
  const cantidad = Number(form.cantidad);
  const cantidadValida = Number.isInteger(cantidad) && cantidad >= 1;
  const faltan = elegido && cantidadValida ? cantidad - elegido.disponible : 0;
  const puedeReservar = Boolean(elegido) && cantidadValida && faltan <= 0;

  const reservar = async (e) => {
    e.preventDefault();
    setAviso(null);
    try {
      await apiFetch('/reservas-equipo', {
        method: 'POST',
        body: {
          equipoId: Number(form.equipoId),
          eventoId: Number(eventoId),
          cantidad,
          responsableId: form.responsableId ? Number(form.responsableId) : null,
        },
      });
      setForm(FORM_VACIO);
      setAviso({ tipo: 'ok', texto: 'Equipo reservado para el evento.' });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  const quitar = async (r) => {
    if (!window.confirm(`¿Quitar "${r.equipo.nombre}" de este evento?`)) return;
    setAviso(null);
    try {
      await apiFetch(`/reservas-equipo/${r.id}`, { method: 'DELETE' });
      setAviso({ tipo: 'ok', texto: 'Reserva eliminada.' });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  let cajaDisponibilidad = null;
  if (elegido && !cantidadValida) {
    cajaDisponibilidad = { clase: 'error', texto: 'Indica una cantidad entera de al menos 1.' };
  } else if (elegido && faltan > 0) {
    cajaDisponibilidad = {
      clase: 'error',
      texto: `Sin stock suficiente: ese día hay ${elegido.disponible} de ${elegido.cantidadTotal} disponibles (otros eventos usan ${elegido.reservadoDia}${
        elegido.cantidadMantencion > 0 ? ` y ${elegido.cantidadMantencion} están en mantención` : ''
      }). Faltan ${faltan}.`,
    };
  } else if (elegido) {
    cajaDisponibilidad = {
      clase: 'ok',
      texto: `Hay ${elegido.disponible} disponibles ese día. Después de esta reserva quedarían ${elegido.disponible - cantidad}.`,
    };
  }

  return (
    <section className="panel">
      <h2>Equipos por evento</h2>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="campo">
        <label>Evento</label>
        <select value={eventoId} onChange={(e) => { setEventoId(e.target.value); setForm(FORM_VACIO); setAviso(null); }}>
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
            <div className="dato"><span>Invitados</span><strong>{evento.numInvitados}</strong></div>
            <div className="dato">
              <span>Estado</span>
              <strong>
                <span className={`status ${evento.confirmado ? 'confirmed' : 'pending'}`}>
                  {evento.confirmado ? 'Confirmado' : 'Pendiente'}
                </span>
              </strong>
            </div>
          </div>

          <h3 className="seccion-titulo">Equipos reservados ({lista.length})</h3>
          {lista.length === 0 ? (
            <p className="pers-vacio">Este evento aún no tiene equipos reservados.</p>
          ) : (
            lista.map((r) => {
              const estado = ESTADOS_RESERVA[r.estado];
              return (
                <div key={r.id} className="fila-personal">
                  <div>
                    <div className="principal">{r.equipo.nombre}</div>
                    <div className="meta">
                      {etiquetaCategoria(r.equipo.categoria)} · {r.cantidad} unidad(es) ·{' '}
                      {r.responsable ? `A cargo de ${r.responsable.nombre}` : 'Sin responsable'}
                    </div>
                  </div>
                  <div className="acciones">
                    <span className={`status ${estado.clase}`}>{estado.texto}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => quitar(r)} disabled={r.estado !== 'RESERVADO'}>
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })
          )}

          <h3 className="seccion-titulo">Agregar equipo</h3>
          <form onSubmit={reservar}>
            <div className="grid-2">
              <div className="campo">
                <label>Equipo</label>
                <select required value={form.equipoId} onChange={(e) => setForm({ ...form, equipoId: e.target.value })}>
                  <option value="">Selecciona…</option>
                  {candidatos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.nombre} ({eq.disponible} disp.)
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Cantidad</label>
                <input required type="number" min="1" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
              </div>
            </div>

            <div className="campo">
              <label>Responsable (opcional)</label>
              <select value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}>
                <option value="">Sin responsable</option>
                {responsables.map((a) => (
                  <option key={a.id} value={a.trabajadorId}>
                    {a.trabajador.nombre} — {etiquetaRol(a.rol)}
                  </option>
                ))}
              </select>
              <span className="ayuda">Solo aparecen los trabajadores asignados a este evento, activos y sin bloqueo.</span>
            </div>

            {cajaDisponibilidad && (
              <div className={`caja-disponibilidad ${cajaDisponibilidad.clase}`}>{cajaDisponibilidad.texto}</div>
            )}

            <button type="submit" className="btn" disabled={!puedeReservar}>
              {elegido && cantidadValida ? `Reservar ${cantidad} unidad(es)` : 'Reservar'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export default EquiposEvento;
