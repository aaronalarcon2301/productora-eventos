import { useState } from 'react';
import './personal.css'; // clases compartidas (subtabs, paneles, avisos)
import './equipos.css';
import InventarioEquipos from './InventarioEquipos';
import EquiposEvento from './EquiposEvento';
import EntregaDevolucion from './EntregaDevolucion';

const VISTAS = [
  { id: 'inventario', label: 'Inventario' },
  { id: 'evento', label: 'Equipos por evento' },
  { id: 'devolucion', label: 'Entrega y devolución' },
];

function GestionEquipos() {
  const [vista, setVista] = useState('inventario');

  return (
    <section className="pagina">
      <header className="pagina-cab">
        <h1>Equipos</h1>
        <p>Inventario, reservas por evento y control de entrega y devolución.</p>
      </header>

      <div className="subtabs">
        {VISTAS.map((v) => (
          <button key={v.id} className={vista === v.id ? 'active' : ''} onClick={() => setVista(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      {vista === 'inventario' && <InventarioEquipos />}
      {vista === 'evento' && <EquiposEvento />}
      {vista === 'devolucion' && <EntregaDevolucion />}
    </section>
  );
}

export default GestionEquipos;
