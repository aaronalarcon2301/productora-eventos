import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';
import CancelacionEvento from './CancelacionEvento';

function EventoCatalogo() {
  const [eventos, setEventos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({ clienteId: '', lugarId: '' });
  const [dataExtra, setDataExtra] = useState({ clientes: [], lugares: [] });

  useEffect(() => {
    Promise.all([fetch(`${API_URL}/clientes`), fetch(`${API_URL}/lugares`)])
      .then(async ([resC, resL]) => setDataExtra({ clientes: await resC.json(), lugares: await resL.json() }));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(Object.entries(filtros).filter(([_, v]) => v));
    fetch(`${API_URL}/eventos?${params}`).then(res => res.json()).then(setEventos);
  }, [filtros]);

  const estadoStr = (ev) => ev.cancelado ? 'cancelled' : ev.confirmado ? 'confirmed' : 'pending';

  return (
    <div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <select onChange={e => setFiltros({...filtros, clienteId: e.target.value})}>
          <option value="">Todos los clientes...</option>
          {dataExtra.clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select onChange={e => setFiltros({...filtros, lugarId: e.target.value})}>
          <option value="">Todos los lugares...</option>
          {dataExtra.lugares.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
        </select>
      </div>

      <section className="panel">
        <h2>Listado de Eventos</h2>
        <ul className="lista-simple">
          {eventos.map(ev => (
            <li key={ev.id}>
              <strong style={{ cursor: 'pointer', color: 'var(--cue)' }} onClick={() => setSeleccionado(ev)}>
                {ev.nombre}
              </strong>
              <span className={`status ${estadoStr(ev)}`}>
                {ev.cancelado ? 'Cancelado' : ev.confirmado ? 'Confirmado' : 'Pendiente'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {seleccionado && (
        <section className="panel">
          <h2>Detalle: {seleccionado.nombre}</h2>
          <p><strong>Fecha:</strong> {new Date(seleccionado.fecha).toLocaleDateString()}</p>
          <p><strong>Presupuesto:</strong> ${seleccionado.presupuesto || 0}</p>
          
          <CancelacionEvento 
            evento={seleccionado} 
            onActualizado={(evActualizado) => setSeleccionado({...seleccionado, ...evActualizado})} 
          />
        </section>
      )}
    </div>
  );
}

export default EventoCatalogo;