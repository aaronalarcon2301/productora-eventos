import { useEffect, useState } from 'react';
import { API_URL } from '../api/config';

function LugarList() {
  const [lugares, setLugares] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [lugarEditando, setLugarEditando] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', ubicacion: '', capacidad: '' });

  const cargarLugares = () => {
    fetch(`${API_URL}/lugares`)
      .then(res => res.json())
      .then(data => {
        setLugares(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error al cargar los lugares:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarLugares();
  }, []);

  const abrirModalNuevo = () => {
    setLugarEditando(null);
    setFormData({ nombre: '', ubicacion: '', capacidad: '' });
    setMostrarModal(true);
  };

  const abrirModalEditar = (lugar) => {
    setLugarEditando(lugar);
    setFormData({
      nombre: lugar.nombre || '',
      ubicacion: lugar.ubicacion || '',
      capacidad: lugar.capacidad || ''
    });
    setMostrarModal(true);
  };

  const eliminarLugar = async (id, nombre) => {
    const confirmado = window.confirm(`¿Estás seguro de que deseas eliminar el lugar "${nombre}"?`);
    if (!confirmado) return;

    try {
      const res = await fetch(`${API_URL}/lugares/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      
      setLugares(lugares.filter(l => l.id !== id));
    } catch (error) {
      alert('Error al eliminar. Es posible que este lugar tenga eventos asociados en el historial. Elimina los eventos primero.');
    }
  };

  const guardarLugar = async (e) => {
    e.preventDefault();
    
    const url = lugarEditando ? `${API_URL}/lugares/${lugarEditando.id}` : `${API_URL}/lugares`;
    const metodo = lugarEditando ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          ubicacion: formData.ubicacion,
          capacidad: Number(formData.capacidad)
        })
      });

      if (!res.ok) throw new Error('Error al guardar el lugar');
      
      cargarLugares(); 
      setMostrarModal(false);
    } catch (error) {
      alert('Error al guardar el lugar. Verifica la conexión con el servidor.');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--ink-dim)' }}>Cargando lugares...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Lugares</h1>
          <p style={{ margin: 0, color: 'var(--ink-dim)', fontSize: '14px' }}>Gestión de locaciones y centros de eventos.</p>
        </div>
        
        <button className="btn" style={{ padding: '8px 16px', fontWeight: 'bold' }} onClick={abrirModalNuevo}>
          + Nuevo lugar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {lugares.map(lugar => (
          <div key={lugar.id} className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--ink)' }}>{lugar.nombre}</h3>
            </div>

            <div style={{ marginBottom: '16px', flexGrow: 1 }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--ink-dim)' }}>
                <strong style={{ color: 'var(--ink)' }}>Dirección:</strong> {lugar.ubicacion || 'No especificada'}
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-dim)' }}>
                <strong style={{ color: 'var(--ink)' }}>Capacidad:</strong> {lugar.capacidad ? `${lugar.capacidad} personas` : 'No definida'}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--ink-dim)', fontWeight: '500' }}>
                {lugar.eventos?.length || 0} {lugar.eventos?.length === 1 ? 'evento asociado' : 'eventos asociados'}
              </span>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-ghost" 
                  style={{ padding: 0, color: 'var(--ink-dim)', fontSize: '13px', fontWeight: '600' }}
                  onClick={() => abrirModalEditar(lugar)}
                >
                  Editar
                </button>
                <button 
                  className="btn btn-ghost" 
                  style={{ padding: 0, color: 'var(--cancel)', fontSize: '13px', fontWeight: '600' }}
                  onClick={() => eliminarLugar(lugar.id, lugar.nombre)}
                >
                  Eliminar
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
      
      {lugares.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-dim)', backgroundColor: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--hairline)' }}>
          No hay lugares registrados actualmente.
        </div>
      )}

      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="panel" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
            <h2 style={{ marginTop: 0 }}>{lugarEditando ? 'Editar Lugar' : 'Registrar Nuevo Lugar'}</h2>
            
            <form onSubmit={guardarLugar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Nombre del Lugar</label>
                <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Salón Las Condes" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Dirección / Ubicación</label>
                <input required value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} placeholder="Ej: Av. Apoquindo 1234" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>Capacidad (personas)</label>
                <input type="number" required min="1" value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} placeholder="Ej: 150" />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button type="submit" className="btn">Guardar</button>
              </div>
            </form>
            
          </div>
        </div>
      )}

    </div>
  );
}

export default LugarList;