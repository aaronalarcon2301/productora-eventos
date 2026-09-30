import { useState } from 'react';
import ClienteList from './components/ClienteList';
import LugarList from './components/LugarList';
import EventoCatalogo from './components/EventoCatalogo';
import EvaluacionTrabajador from './components/EvaluacionTrabajador';

const TABS = [
  { id: 'eventos', label: 'Eventos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'lugares', label: 'Lugares' },
  { id: 'personal', label: 'Personal' },
];

function App() {
  const [vista, setVista] = useState('eventos');

  return (
    <div>
      <nav className="navbar">
        <h2>NES Producciones</h2>
        <div className="nav-links">
          {TABS.map((tab) => (
            <button key={tab.id} className={vista === tab.id ? 'active' : ''} onClick={() => setVista(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="container">
        {vista === 'eventos' && <EventoCatalogo />}
        {vista === 'clientes' && <ClienteList />}
        {vista === 'lugares' && <LugarList />}
        {vista === 'personal' && <EvaluacionTrabajador />}
      </main>
    </div>
  );
}

export default App;