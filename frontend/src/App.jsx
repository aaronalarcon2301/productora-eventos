import { useState } from 'react';
import Inicio from './components/Inicio';
import ClienteList from './components/ClienteList';
import LugarList from './components/LugarList';
import EventoCatalogo from './components/EventoCatalogo';
import GestionPersonal from './components/GestionPersonal';
import GestionEquipos from './components/GestionEquipos';
import ConfiguracionPoliticas from './components/ConfiguracionPoliticas';

const TABS = [
  { id: 'eventos', label: 'Eventos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'lugares', label: 'Lugares' },
  { id: 'personal', label: 'Personal' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'Configurar Politicas', label: 'Configurar Políticas' }
];

function App() {
  const [vista, setVista] = useState('inicio');

  return (
    <div>
      <nav className="navbar">
        <h2 style={{ cursor: 'pointer' }} onClick={() => setVista('inicio')}>
          NES Producciones
        </h2> 
        <div className="nav-links">
          {TABS.map((tab) => (
            <button key={tab.id} className={vista === tab.id ? 'active' : ''} onClick={() => setVista(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="container">
        {/* Renderizado condicional de las vistas */}
        {vista === 'inicio' && <Inicio setVista={setVista} />}
        {vista === 'eventos' && <EventoCatalogo />}
        {vista === 'clientes' && <ClienteList />}
        {vista === 'lugares' && <LugarList />}
        {vista === 'personal' && <GestionPersonal />}
        {vista === 'equipos' && <GestionEquipos />}
        {vista === 'Configurar Politicas' && <ConfiguracionPoliticas />}
      </main>
    </div>
  );
}

export default App;