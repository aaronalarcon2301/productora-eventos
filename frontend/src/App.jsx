import { useEffect, useState } from 'react';

import Inicio from './components/Inicio';
import Login from './components/Login';
import AprobacionPresupuestos from './components/AprobacionPresupuestos';
import MisSolicitudes from './components/MisSolicitudes';

import ClienteList from './components/ClienteList';
import LugarList from './components/LugarList';
import EventoCatalogo from './components/EventoCatalogo';
import GestionPersonal from './components/GestionPersonal';
import GestionEquipos from './components/GestionEquipos';
import ConfiguracionPoliticas from './components/ConfiguracionPoliticas';

import { apiFetch } from './api/apiFetch';
import { getSession, clearSession } from './api/session';

const TABS_GERENTE = [
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'lugares', label: 'Lugares' },
  { id: 'personal', label: 'Personal' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'Configurar Politicas', label: 'Políticas' }
];

const TABS_TRABAJADOR = [
  { id: 'eventos', label: 'Eventos aprobados' },
  { id: 'mis-solicitudes', label: 'Mis solicitudes' }
];

function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('inicio');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const sesionExpirada = () => {
      clearSession();
      setUsuario(null);
      setVista('inicio');
    };

    window.addEventListener(
      'nes:sesion-expirada',
      sesionExpirada
    );

    if (!getSession()) {
      setCargando(false);
    } else {
      apiFetch('/auth/me')
        .then(({ usuario: activo }) => {
          setUsuario(activo);
          setVista(
            activo.rol === 'GERENTE'
              ? 'presupuestos'
              : 'eventos'
          );
        })
        .catch(sesionExpirada)
        .finally(() => setCargando(false));
    }

    return () => {
      window.removeEventListener(
        'nes:sesion-expirada',
        sesionExpirada
      );
    };
  }, []);

  const ingresar = (usuarioActivo) => {
    setUsuario(usuarioActivo);
    setVista(
      usuarioActivo.rol === 'GERENTE'
        ? 'presupuestos'
        : 'eventos'
    );
  };

  const cerrarSesion = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Cerrar la sesión local incluso si falla la conexión.
    }

    clearSession();
    setUsuario(null);
    setVista('inicio');
  };

  if (cargando) {
    return (
      <div className="loading-screen">
        Cargando NES Producciones...
      </div>
    );
  }

  if (!usuario) {
    return <Login onLogin={ingresar} />;
  }

  const esGerente = usuario.rol === 'GERENTE';

  const tabs = esGerente
    ? TABS_GERENTE
    : TABS_TRABAJADOR;

  return (
    <div>
      <nav className="navbar">
        <h2
          style={{
            cursor: esGerente ? 'pointer' : 'default'
          }}
          onClick={() => esGerente && setVista('inicio')}
        >
          NES Producciones
        </h2>

        <div className="nav-links">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={vista === tab.id ? 'active' : ''}
              onClick={() => setVista(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="user-menu">
          <div className="user-label">
            <strong>{usuario.nombre}</strong>
            <small>
              {esGerente ? 'Gerente' : 'Trabajador'}
            </small>
          </div>

          <button
            className="btn btn-ghost"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="container">

        {esGerente && vista === 'inicio' && (
          <Inicio setVista={setVista} />
        )}

        {esGerente && vista === 'presupuestos' && (
          <AprobacionPresupuestos />
        )}

        {vista === 'eventos' && (
          <EventoCatalogo
            rol={usuario.rol}
            setVista={setVista}
          />
        )}

        {!esGerente && vista === 'mis-solicitudes' && (
          <MisSolicitudes setVista={setVista} />
        )}

        {esGerente && vista === 'clientes' && (
          <ClienteList />
        )}

        {esGerente && vista === 'lugares' && (
          <LugarList />
        )}

        {esGerente && vista === 'personal' && (
          <GestionPersonal />
        )}

        {esGerente && vista === 'equipos' && (
          <GestionEquipos />
        )}

        {esGerente && vista === 'Configurar Politicas' && (
          <ConfiguracionPoliticas />
        )}

      </main>
    </div>
  );
}

export default App;