import { useState } from 'react';
import ClienteList from './components/ClienteList';
import LugarList from './components/LugarList';
import EventoCatalogo from './components/EventoCatalogo';
import EvaluacionTrabajador from './components/EvaluacionTrabajador';

function App() {
  const [vista, setVista] = useState('eventos');

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Productora de Eventos NES</h1>

      <nav style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setVista('eventos')}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            fontWeight: vista === 'eventos' ? 'bold' : 'normal',
            backgroundColor: vista === 'eventos' ? '#ddd' : '#fff',
          }}
        >
          Eventos
        </button>
        <button
          onClick={() => setVista('evaluacion')}
          style={{
            padding: '8px 16px',
            fontWeight: vista === 'evaluacion' ? 'bold' : 'normal',
            backgroundColor: vista === 'evaluacion' ? '#ddd' : '#fff',
          }}
        >
          Evaluación de trabajadores
        </button>
      </nav>

      {vista === 'eventos' && (
        <>
          <ClienteList />
          <LugarList />
          <EventoCatalogo />
        </>
      )}

      {vista === 'evaluacion' && <EvaluacionTrabajador />}
    </div>
  );
}

export default App;