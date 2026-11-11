import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';
import CancelacionEvento from './CancelacionEvento';
import FinalizacionEvento from './FinalizacionEvento';

function FormularioNuevoEvento({ clientes, lugares, onGuardar, onCancelar }) {
  const [formData, setFormData] = useState({ 
    nombre: '', 
    fecha: '', 
    presupuesto: '', 
    clienteId: '', 
    lugarId: '',
    clienteNombre: '',
    lugarNombre: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          fecha: formData.fecha,
          // Convertimos el presupuesto con puntos a un número limpio para la BD
          presupuesto: Number(String(formData.presupuesto).replace(/\./g, '')),
          clienteId: formData.clienteId ? Number(formData.clienteId) : null,
          clienteNombre: formData.clienteNombre,
          lugarId: formData.lugarId ? Number(formData.lugarId) : null,
          lugarNombre: formData.lugarNombre
        })
      });

      if (!res.ok) throw new Error('Error al crear el evento');
      
      const respuestaBackend = await res.json();
      const eventoFinal = respuestaBackend.data || respuestaBackend.nuevoEvento || respuestaBackend.evento || respuestaBackend;
      
      onGuardar(eventoFinal); 
    } catch (error) {
      alert('Error al guardar el evento. Verifica la conexión con el servidor o asegúrate de haber seleccionado un cliente/lugar válido.');
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
          
          {/* Campo Presupuesto único y con formateo de puntos */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Presupuesto ($)</label>
            <input 
              type="text" 
              required 
              value={formData.presupuesto} 
              placeholder="Ej: 500.000"
              onChange={(e) => {
                const valorCrudo = e.target.value.replace(/\D/g, '');
                
                if (!valorCrudo) {
                  setFormData({...formData, presupuesto: ''});
                  return;
                }
                
                const valorFormateado = new Intl.NumberFormat('es-CL').format(parseInt(valorCrudo, 10));
                setFormData({...formData, presupuesto: valorFormateado});
              }} 
            />
          </div>
          
          {/* Campo Cliente */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Cliente</label>
            <input 
              required
              type="text" 
              list="lista-clientes" 
              placeholder="Agregue o seleccione un cliente..."
              value={formData.clienteNombre}
              onChange={(e) => {
                const nombreTipeado = e.target.value;
                const clienteEncontrado = clientes.find(c => c.nombre === nombreTipeado);
                setFormData({ 
                  ...formData, 
                  clienteNombre: nombreTipeado,
                  clienteId: clienteEncontrado ? clienteEncontrado.id : '' 
                });
              }}
            />
            <datalist id="lista-clientes">
              {clientes.map(c => <option key={c.id} value={c.nombre} />)}
            </datalist>
          </div>
          
          {/* Campo Lugar */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Lugar</label>
            <input 
              required
              type="text" 
              list="lista-lugares" 
              placeholder="Agregue o seleccione un lugar..."
              value={formData.lugarNombre}
              onChange={(e) => {
                const nombreTipeado = e.target.value;
                const lugarEncontrado = lugares.find(l => l.nombre === nombreTipeado);
                setFormData({ 
                  ...formData, 
                  lugarNombre: nombreTipeado,
                  lugarId: lugarEncontrado ? lugarEncontrado.id : '' 
                });
              }}
            />
            <datalist id="lista-lugares">
              {lugares.map(l => <option key={l.id} value={l.nombre} />)}
            </datalist>
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

  const cargarEventos = () => {
    const params = new URLSearchParams(Object.entries(filtros).filter(([_, v]) => v));
    fetch(`${API_URL}/eventos?${params}`)
      .then(res => res.json())
      .then(setEventos);
  };

  useEffect(() => {
    Promise.all([fetch(`${API_URL}/clientes`), fetch(`${API_URL}/lugares`)])
      .then(async ([resC, resL]) => setDataExtra({ clientes: await resC.json(), lugares: await resL.json() }));
  }, []);

  useEffect(() => {
    cargarEventos();
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
                <span className={`status ${ev.cancelado ? 'cancelled' : (ev.finalizado ? 'finalizado' : (ev.confirmado ? 'confirmed' : 'pending'))}`}>
                  {ev.cancelado ? 'CANCELADO' : (ev.finalizado ? 'FINALIZADO' : (ev.confirmado ? 'CONFIRMADO' : 'PENDIENTE'))}
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

          <FinalizacionEvento
            evento={seleccionado}
            onActualizado={(evActualizado) => {
              setSeleccionado(evActualizado);
              setEventos(eventos.map((ev) => (ev.id === evActualizado.id ? { ...ev, ...evActualizado } : ev)));
            }}
          />
        </section>
      )}

      {mostrarModal && (
        <FormularioNuevoEvento 
          clientes={dataExtra.clientes} 
          lugares={dataExtra.lugares}
          onCancelar={() => setMostrarModal(false)}
          onGuardar={(nuevoEvento) => {
            setMostrarModal(false);
            
            console.log("Lo que el backend nos respondió al guardar:", nuevoEvento);
            
            if (nuevoEvento && nuevoEvento.id) {
              setEventos(eventosPrevios => [...eventosPrevios, nuevoEvento]);
            } else {
              cargarEventos();
            }
          }}
        />
      )}
    </div>
  );
}

export default EventoCatalogo;