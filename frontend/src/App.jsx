import { useState } from 'react';
import ClienteList from './components/ClienteList';
import LugarList from './components/LugarList';
import EventoCatalogo from './components/EventoCatalogo';
import EvaluacionTrabajador from './components/EvaluacionTrabajador';
import HistorialTrabajador from './components/HistorialTrabajador';

function App() {
  const [vista, setVista] = useState('eventos');
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Productora de Eventos NES</h1>

      {/* Se agregó display flex y justifyContent center para centrar los botones */}
      <nav style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => {
            setVista('eventos');
            setMenuAbierto(false);
          }}
          style={{
            padding: '10px 20px',
            marginRight: '15px',
            fontWeight: vista === 'eventos' ? 'bold' : 'normal',
            backgroundColor: vista === 'eventos' ? '#e0e0e0' : '#ffffff',
            color: '#000000', // <-- Texto negro para que sea visible
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Eventos
        </button>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            style={{
              padding: '10px 20px',
              fontWeight: (vista === 'evaluacion' || vista === 'historial') ? 'bold' : 'normal',
              backgroundColor: (vista === 'evaluacion' || vista === 'historial') ? '#e0e0e0' : '#ffffff',
              color: '#000000', // <-- Texto negro para que sea visible
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Gestión de Recursos {menuAbierto ? '▲' : '▼'}
          </button>

          {menuAbierto && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '5px',
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '5px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: '220px',
              zIndex: 10,
              overflow: 'hidden'
            }}>
              <button
                onClick={() => { setVista('evaluacion'); setMenuAbierto(false); }}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  border: 'none', 
                  borderBottom: '1px solid #eee', 
                  backgroundColor: vista === 'evaluacion' ? '#e0e0e0' : '#ffffff', 
                  color: '#000000', // <-- Texto negro
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                Evaluación de trabajadores
              </button>
              <button
                onClick={() => { setVista('historial'); setMenuAbierto(false); }}
                style={{ 
                  padding: '12px 15px', 
                  textAlign: 'left', 
                  border: 'none', 
                  backgroundColor: vista === 'historial' ? '#e0e0e0' : '#ffffff', 
                  color: '#000000', // <-- Texto negro
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                Historial de Desempeño
              </button>
            </div>
          )}
        </div>
      </nav>

      {vista === 'eventos' && (
        <>
          <ClienteList />
          <LugarList />
          <EventoCatalogo />
        </>
      )}

      {vista === 'evaluacion' && <EvaluacionTrabajador />}
      {vista === 'historial' && <HistorialTrabajador />}
    </div>
  );
}

export default App;