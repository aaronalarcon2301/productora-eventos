import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';
import CancelacionEvento from './CancelacionEvento';

function FormularioNuevoEvento({ clientes, lugares, onGuardar, onCancelar }) {
  const [formData, setFormData] = useState({ nombre: '', fecha: '', presupuesto: '', clienteId: '', lugarId: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          fecha: formData.fecha,
          presupuesto: Number(formData.presupuesto),
          clienteId: Number(formData.clienteId),
          lugarId: Number(formData.lugarId)
        })
      });

      if (!res.ok) throw new Error('Error al crear el evento');
      
      const nuevoEvento = await res.json();
      onGuardar(nuevoEvento); 
    } catch (error) {
      alert('Error al guardar el evento. Verifica la conexión con el servidor.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="panel" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
        <h2 style={{ marginTop: 0 }}>Registrar Nuevo Evento</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Nombre del Evento</label>
            <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Cena de Aniversario" />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Fecha</label>
            <input type="date" required value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Presupuesto ($)</label>
            <input type="number" required min="1" value={formData.presupuesto} onChange={e => setFormData({...formData, presupuesto: e.target.value})} placeholder="Ej: 500000" />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Cliente</label>
            <select required value={formData.clienteId} onChange={e => setFormData({...formData, clienteId: e.target.value})}>
              <option value="">Seleccione un cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Lugar</label>
            <select required value={formData.lugarId} onChange={e => setFormData({...formData, lugarId: e.target.value})}>
              <option value="">Seleccione un lugar...</option>
              {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
            <button type="submit" className="btn">Guardar Evento</button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
function EventoCatalogo() {
  const [eventos, setEventos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({ clienteId: '', lugarId: '' });
  const [dataExtra, setDataExtra] = useState({ clientes: [], lugares: [] });
  
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    Promise.all([fetch(`${API_URL}/clientes`), fetch(`${API_URL}/lugares`)])
      .then(async ([resC, resL]) => setDataExtra({ clientes: await resC.json(), lugares: await resL.json() }));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(Object.entries(filtros).filter(([_, v]) => v));
    fetch(`${API_URL}/eventos?${params}`).then(res => res.json()).then(setEventos);
  }, [filtros]);

  const eliminarEvento = async (evento, e) => {
    e.stopPropagation();

    if (!evento.cancelado){
      alert("No se puede eliminar un evento que no está cancelado. Por favor, cancele el evento primero.");
      return;
    }

    const confirmado = window.confirm(`¿Está seguro de que desea eliminar el evento "${evento.nombre}"? Esta acción no se puede deshacer.`);
    
    if (confirmado) {
      try {
        const res = await fetch(`${API_URL}/eventos/${evento.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar el evento');
        setEventos(eventos.filter(ev => ev.id !== evento.id));
        setSeleccionado(null);
      } catch (error) {
        alert('Error al eliminar el evento. Por favor, inténtelo de nuevo más tarde.');
      }
    }
  };

  return (
    <div>
      <div className="filtros-container">
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--hairline)', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Listado de Eventos</h2>
          
          <button className="btn" onClick={() => setMostrarModal(true)}>
            + Nuevo Evento
          </button>
        </div>
        
        <ul className="lista-simple">
          {eventos.map(ev => (
            <li key={ev.id}>
              <strong className="enlace-evento" style={{ cursor: 'pointer' }} onClick={() => setSeleccionado(ev)}>
                {ev.nombre}
              </strong>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span className={`status ${ev.cancelado ? 'cancelled' : (ev.confirmado ? 'confirmed' : 'pending')}`}>
                  {ev.cancelado ? 'CANCELADO' : (ev.confirmado ? 'CONFIRMADO' : 'PENDIENTE')}
                </span>

                <button
                  className="btn btn-ghost"
                  style={{ padding: '6px 12px', color: 'var(--cancel)', cursor: 'pointer', fontSize: '13px', fontWeight: '600'}}
                  onClick={(e) => eliminarEvento(ev, e)}
                >
                  Eliminar
                </button>
              </div>
            </li>  
          ))}
        </ul>
      </section>

      {seleccionado && (
        <section className="panel">
          <h2>Detalle: {seleccionado.nombre}</h2>
          <p><strong>Fecha:</strong> {new Date(seleccionado.fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</p>
          <p><strong>Presupuesto:</strong> ${seleccionado.presupuesto?.toLocaleString('es-CL') || 0}</p>
          
          <CancelacionEvento 
            evento={seleccionado} 
            onActualizado={(evActualizado) => setSeleccionado({...seleccionado, ...evActualizado})} 
          />
        </section>
      )}

      {mostrarModal && (
        <FormularioNuevoEvento 
          clientes={dataExtra.clientes} 
          lugares={dataExtra.lugares}
          onCancelar={() => setMostrarModal(false)}
          onGuardar={(nuevoEvento) => {
            setEventos([...eventos, nuevoEvento]); 
            setMostrarModal(false); 
          }}
        />
      )}
    </div>
  );
}

export default EventoCatalogo;