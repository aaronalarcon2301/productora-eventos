import { useState } from 'react';
import './personal.css';
import TrabajadorList from './TrabajadorList';
import AsignacionPersonal from './AsignacionPersonal';
import EvaluacionTrabajador from './EvaluacionTrabajador';
import HistorialTrabajador from './HistorialTrabajador';

const VISTAS = [
  { id: 'trabajadores', label: 'Trabajadores' },
  { id: 'asignaciones', label: 'Asignaciones' },
  { id: 'evaluar', label: 'Evaluar' },
  { id: 'historial', label: 'Historial' },
];

function GestionPersonal() {
  const [vista, setVista] = useState('trabajadores');
  const [trabajadorId, setTrabajadorId] = useState('');

  const irA = (nuevaVista, id) => {
    setTrabajadorId(String(id));
    setVista(nuevaVista);
  };

  return (
    <section className="pagina">
      <header className="pagina-cab">
        <h1>Personal</h1>
        <p>Trabajadores eventuales, asignación a eventos, evaluaciones e historial.</p>
      </header>

      <div className="subtabs">
        {VISTAS.map((v) => (
          <button key={v.id} className={vista === v.id ? 'active' : ''} onClick={() => setVista(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      {vista === 'trabajadores' && (
        <TrabajadorList onEvaluar={(id) => irA('evaluar', id)} onHistorial={(id) => irA('historial', id)} />
      )}
      {vista === 'asignaciones' && <AsignacionPersonal />}
      {vista === 'evaluar' && (
        <EvaluacionTrabajador
          trabajadorId={trabajadorId}
          setTrabajadorId={setTrabajadorId}
          onVerHistorial={(id) => irA('historial', id)}
        />
      )}
      {vista === 'historial' && <HistorialTrabajador trabajadorId={trabajadorId} setTrabajadorId={setTrabajadorId} />}
    </section>
  );
}

export default GestionPersonal;
