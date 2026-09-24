// Componente principal - Clientes y Lugares ya están resueltos como referencia.
// Debajo va el espacio para el catálogo de Eventos - ESO es tu actividad.
import ClienteList from './components/ClienteList';
import LugarList from './components/LugarList';
import EventoCatalogo from './components/EventoCatalogo'; 

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🎉 ProductoraAPI</h1>

      <ClienteList />
      <LugarList />

      {<EventoCatalogo />}
    </div>
  );
}

export default App;