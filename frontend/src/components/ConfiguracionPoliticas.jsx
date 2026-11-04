import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';

function ConfiguracionPoliticas() {
  const [politicas, setPoliticas] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/politicas`)
      .then(res => res.json())
      .then(setPoliticas);
  }, []);

  const handlePorcentajeChange = (id, nuevoValor) => {
    setPoliticas(politicas.map(p => 
      p.id === id ? { ...p, porcentaje: nuevoValor } : p
    ));
  };

  const guardarCambios = async (id, porcentaje) => {
    try {
      const res = await fetch(`${API_URL}/politicas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ porcentaje })
      });
      if (res.ok) alert('Política actualizada correctamente');
    } catch (error) {
      alert('Error al guardar los cambios');
    }
  };

  return (
    <section className="panel" style={{ maxWidth: '600px' }}>
      <h2>Políticas de Devolución</h2>
      <ul className="lista-simple">
        {politicas.map(p => (
          <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {p.diasHasta 
                ? `Entre ${p.diasDesde} y ${p.diasHasta} días hábiles` 
                : `Más de ${p.diasDesde} días hábiles`}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="number" 
                min="0" 
                max="100"
                value={p.porcentaje} 
                onChange={(e) => handlePorcentajeChange(p.id, e.target.value)}
                style={{ width: '70px', padding: '4px' }}
              /> %
              <button className="btn" onClick={() => guardarCambios(p.id, p.porcentaje)}>
                Guardar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ConfiguracionPoliticas;