import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import { formatearFecha } from './personalConstantes';
import { formatearPrecio } from './equiposConstantes';
import { iniciales } from './clientesUtil';
import './personal.css';
import './clientes.css';
import './finalizacion.css';

function estadoEvento(e) {
  if (e.cancelado) return { texto: 'Cancelado', clase: 'cancelled' };
  if (e.finalizado) return { texto: 'Finalizado', clase: 'finalizado' };
  if (e.confirmado) return { texto: 'Confirmado', clase: 'confirmed' };
  return { texto: 'Pendiente', clase: 'pending' };
}

function FichaCliente({ id, onVolver, onEditar }) {
  const [cliente, setCliente] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    apiFetch(`/clientes/${id}`)
      .then((datos) => activo && setCliente(datos))
      .catch((err) => activo && setError(err.message));
    return () => {
      activo = false;
    };
  }, [id]);

  if (error) return <div className="pers-alert error">{error}</div>;
  if (!cliente) return <p className="pers-vacio">Cargando cliente…</p>;

  const eventos = cliente.eventos;
  const vigentes = eventos.filter((e) => !e.cancelado);
  const total = vigentes.reduce((suma, e) => suma + (e.presupuesto ?? 0), 0);
  const reclamos = eventos.reduce((suma, e) => suma + e._count.reclamos, 0);
  const hoy = new Date();
  const inicioHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const proximo = vigentes
    .filter((e) => new Date(e.fecha).getTime() >= inicioHoy)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];

  const resumen = [
    { etiqueta: 'Eventos', valor: vigentes.length },
    { etiqueta: 'Total contratado', valor: formatearPrecio(total), clase: 'destacado' },
    { etiqueta: 'Próximo evento', valor: proximo ? formatearFecha(proximo.fecha) : '—' },
    { etiqueta: 'Reclamos', valor: reclamos, clase: reclamos > 0 ? 'alerta' : 'ok' },
  ];

  return (
    <section className="pagina-seccion">
      <button className="volver" onClick={onVolver}>← Volver a clientes</button>

      <div className="ficha-cab">
        <div className="avatar grande" aria-hidden="true">{iniciales(cliente.nombre)}</div>
        <div className="ficha-titulo">
          <div className="ficha-titulo-fila">
            <h2>{cliente.nombre}</h2>
            {vigentes.length >= 3 && <span className="status confirmed">Frecuente</span>}
          </div>
          <div className="ficha-contacto">
            <span className={cliente.rut ? '' : 'falta'}>{cliente.rut ? `RUT ${cliente.rut}` : 'Falta RUT'}</span>
            <span className={cliente.email ? '' : 'falta'}>{cliente.email ?? 'Falta email'}</span>
            <span className={cliente.telefono ? '' : 'falta'}>{cliente.telefono ?? 'Falta teléfono'}</span>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => onEditar(cliente)}>Editar</button>
      </div>

      <div className="stats">
        {resumen.map((r) => (
          <div key={r.etiqueta} className={`stat ${r.clase ?? ''}`}>
            <span>{r.etiqueta}</span>
            <strong>{r.valor}</strong>
          </div>
        ))}
      </div>

      <div className="eventos-cliente">
        <h3>Eventos del cliente</h3>
        <p className="subtitulo">Del más reciente al más antiguo.</p>
        {eventos.length === 0 ? (
          <p className="pers-vacio">Este cliente aún no tiene eventos.</p>
        ) : (
          eventos.map((e) => {
            const estado = estadoEvento(e);
            return (
              <div key={e.id} className="evento-fila">
                <div className="evento-info">
                  <strong>{e.nombre}</strong>
                  <span>
                    {formatearFecha(e.fecha)} · {e.lugar?.nombre ?? 'Sin lugar'} · {e.numInvitados} invitados
                  </span>
                </div>
                <div className="evento-monto">{e.presupuesto != null ? formatearPrecio(e.presupuesto) : '—'}</div>
                <span className={`status ${estado.clase}`}>{estado.texto}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default FichaCliente;
