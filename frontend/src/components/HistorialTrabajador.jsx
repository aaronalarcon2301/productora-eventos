import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';

function HistorialTrabajador() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [trabajadorId, setTrabajadorId] = useState('');
  const [historial, setHistorial] = useState(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/trabajadores`)
      .then((res) => res.json())
      .then(setTrabajadores)
      .catch(() => setMensaje('Error al cargar trabajadores'));
  }, []);

  useEffect(() => {
    if (!trabajadorId) {
      setHistorial(null);
      return;
    }

    setMensaje('Cargando historial...');
    fetch(`${API_URL}/trabajadores/${trabajadorId}/historial`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al obtener historial');
        setHistorial(data);
        setMensaje('');
      })
      .catch((err) => {
        setHistorial(null);
        setMensaje(err.message);
      });
  }, [trabajadorId]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Historial de Desempeño</h2>

      <select
        value={trabajadorId}
        onChange={(e) => setTrabajadorId(e.target.value)}
        style={{ padding: '8px', marginBottom: '20px', width: '300px' }}
      >
        <option value="">-- Selecciona un trabajador --</option>
        {trabajadores.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </select>

      {mensaje && <p>{mensaje}</p>}

      {historial && (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h3>{historial.nombre}</h3>
          <p>
            <strong>Estado:</strong>{' '}
            <span style={{ color: historial.estado === 'BLOQUEADO' ? 'red' : '#4ade80', fontWeight: 'bold' }}>
              {historial.estado}
            </span>
          </p>
          <p><strong>Promedio General:</strong> {historial.promedioGeneral ? historial.promedioGeneral.toFixed(1) : 'Sin evaluaciones'}</p>

          <hr style={{ margin: '20px 0', borderColor: '#444' }} />

          <h4>Promedios por Rol</h4>
          {historial.promediosPorRol && Object.keys(historial.promediosPorRol).length > 0 ? (
            <ul>
              {Object.entries(historial.promediosPorRol).map(([rol, promedio]) => (
                <li key={rol}>
                  <strong>{rol}:</strong> {promedio.toFixed(1)}
                </li>
              ))}
            </ul>
          ) : (
            <p>Aún no hay roles evaluados.</p>
          )}

          <hr style={{ margin: '20px 0', borderColor: '#444' }} />

          <h4>Evaluaciones Registradas ({historial.evaluaciones?.length || 0})</h4>
          {historial.evaluaciones?.map((ev, index) => (
            <div 
              key={index} 
              style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px', color: '#000', textAlign: 'left' }}
            >
              <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                <strong>Rol evaluado:</strong> {ev.rolEvento}
              </p>
              
              <p style={{ margin: 0 }}>
                <strong>Puntualidad:</strong> {ev.promedioPuntualidad ?? 'N/A'} &nbsp;|&nbsp; 
                <strong>Trato:</strong> {ev.promedioTrato ?? 'N/A'} &nbsp;|&nbsp; 
                <strong>Eficiencia:</strong> {ev.promedioEficiencia ?? 'N/A'}
              </p>
              
              {ev.manejoEquipos != null && (
                <p style={{ margin: '10px 0 0 0' }}>
                  <strong>Manejo de equipos:</strong> {ev.manejoEquipos}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistorialTrabajador;