import ClienteList from './components/ClienteList';
import LugarList from './components/LugarList';
import EventoCatalogo from './components/EventoCatalogo'; 

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Productora de Eventos NES</h1>

      <ClienteList />
      <LugarList />

      {<EventoCatalogo />}
    </div>
  );
}

export default App;