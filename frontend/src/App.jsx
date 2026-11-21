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
import ListaCarga from './components/ListaCarga';
import ReclamosGestion from './components/ReclamosGestion';
import MisAsignaciones from './components/MisAsignaciones';
import MisEvaluaciones from './components/MisEvaluaciones';
import MisDatos from './components/MisDatos';

import { apiFetch } from './api/apiFetch';
import { getSession, clearSession } from './api/session';
import { leerVista, guardarVista, borrarVistas } from './api/vistaGuardada';

const TABS_GERENTE = [
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'lugares', label: 'Lugares' },
  { id: 'personal', label: 'Personal' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'Configurar Politicas', label: 'Políticas' },
  { id: 'lista-carga', label: 'Lista de carga' },
  { id: 'reclamos-gestion', label: 'Reclamos' }
];

const TABS_TRABAJADOR = [
  { id: 'eventos', label: 'Eventos aprobados' },
  { id: 'mis-solicitudes', label: 'Mis solicitudes' },
  { id: 'lista-carga', label: 'Lista de carga' },
  { id: 'reclamos-gestion', label: 'Reclamos' }
];

const TABS_PERSONAL = [
  { id: 'mis-asignaciones', label: 'Mis asignaciones' },
  { id: 'mis-evaluaciones', label: 'Mis evaluaciones' },
  { id: 'mis-datos', label: 'Mis datos' }
];

const ETIQUETAS_ROL = {
  GERENTE: 'Gerente',
  TRABAJADOR: 'Trabajador',
  PERSONAL: 'Personal'
};

const vistaInicial = (rol) => {
  if (rol === 'GERENTE') return 'inicio';
  if (rol === 'PERSONAL') return 'mis-asignaciones';
  return 'eventos';
};

const TABS_POR_ROL = {
  GERENTE: TABS_GERENTE,
  TRABAJADOR: TABS_TRABAJADOR,
  PERSONAL: TABS_PERSONAL
};

// Al refrescar vuelve a la pestaña guardada, si todavía corresponde al rol del usuario.
const vistaAlRecargar = (rol) => {
  const guardada = leerVista('principal');
  const validas = (TABS_POR_ROL[rol] ?? []).map((t) => t.id);
  if (rol === 'GERENTE') validas.push('inicio');
  return validas.includes(guardada) ? guardada : vistaInicial(rol);
};

function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('inicio');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const sesionExpirada = () => {
      clearSession();
      borrarVistas();
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
          setVista(vistaAlRecargar(activo.rol));
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

  // Guarda la pestaña actual para poder volver a ella al refrescar la página.
  useEffect(() => {
    if (usuario) guardarVista('principal', vista);
  }, [usuario, vista]);

  const ingresar = (usuarioActivo) => {
    setUsuario(usuarioActivo);
    setVista(vistaInicial(usuarioActivo.rol));
  };

  const cerrarSesion = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Cerrar la sesión local incluso si falla la conexión.
    }

    clearSession();
    borrarVistas();
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
  const esPersonal = usuario.rol === 'PERSONAL';

  const tabs = esGerente
    ? TABS_GERENTE
    : esPersonal
      ? TABS_PERSONAL
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
              {ETIQUETAS_ROL[usuario.rol]}
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
          <Inicio />
        )}

        {esGerente && vista === 'presupuestos' && (
          <AprobacionPresupuestos />
        )}

        {!esPersonal && vista === 'eventos' && (
          <EventoCatalogo
            rol={usuario.rol}
            setVista={setVista}
          />
        )}

        {!esGerente && !esPersonal && vista === 'mis-solicitudes' && (
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

        {!esPersonal && vista === 'lista-carga' && (
          <ListaCarga rol={usuario.rol} />
        )}

        {!esPersonal && vista === 'reclamos-gestion' && (
          <ReclamosGestion rol={usuario.rol} />
        )}

        {esPersonal && vista === 'mis-asignaciones' && (
          <MisAsignaciones />
        )}

        {esPersonal && vista === 'mis-evaluaciones' && (
          <MisEvaluaciones />
        )}

        {esPersonal && vista === 'mis-datos' && (
          <MisDatos />
        )}

      </main>
    </div>
  );
}

export default App;