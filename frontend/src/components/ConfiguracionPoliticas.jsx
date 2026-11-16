import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';

function ConfiguracionPoliticas() {
  const [politicas, setPoliticas] = useState([]);

  useEffect(() => {
  apiFetch('/politicas')
    .then(setPoliticas)
    .catch(error => console.error(error.message));
}, []);

  const handleChange = (id, campo, valor) => {
    setPoliticas(politicas.map(p => 
      p.id === id ? { ...p, [campo]: valor } : p
    ));
  };

  const guardarCambios = async (p, index) => {
  try {
    const esUltimo = index === politicas.length - 1;

    await apiFetch(`/politicas/${p.id}`, {
      method: 'PUT',
      body: {
        porcentaje: Number(p.porcentaje),
        diasDesde: Number(p.diasDesde),
        diasHasta: esUltimo ? null : Number(p.diasHasta)
      }
    });

    alert('Política actualizada correctamente');
  } catch (error) {
    alert(error.message);
  }
};

  return (
    <section className="panel" style={{ maxWidth: '750px' }}>
      <h2>Políticas de Devolución</h2>
      <ul className="lista-simple">
        {/* Agregamos el parámetro 'index' aquí abajo */}
        {politicas.map((p, index) => (
          <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              Desde 
              <input 
                type="number" 
                min="0"
                value={p.diasDesde} 
                onChange={(e) => handleChange(p.id, 'diasDesde', e.target.value)}
                style={{ width: '60px', padding: '4px' }}
              /> 
              hasta 
              
              {/* Condición: Si es el último elemento, mostramos infinito bloqueado */}
              {index === politicas.length - 1 ? (
                <input 
                  type="text" 
                  value="∞" 
                  disabled
                  style={{ width: '60px', padding: '4px', textAlign: 'center', cursor: 'not-allowed', backgroundColor: '#333', color: '#888', border: '1px solid #444' }}
                />
              ) : (
                <input 
                  type="number" 
                  min="0"
                  value={p.diasHasta || ''} 
                  onChange={(e) => handleChange(p.id, 'diasHasta', e.target.value)}
                  style={{ width: '60px', padding: '4px' }}
                /> 
              )}
              
              días hábiles
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="number" 
                min="0" 
                max="100"
                value={p.porcentaje} 
                onChange={(e) => handleChange(p.id, 'porcentaje', e.target.value)}
                style={{ width: '70px', padding: '4px' }}
              /> %
              {/* Pasamos el index a la función al hacer clic */}
              <button className="btn" onClick={() => guardarCambios(p, index)}>
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