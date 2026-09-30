import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';

function EvaluacionTrabajador() {
  const [data, setData] = useState({ trabajadores: [], eventos: [] });
  const [form, setForm] = useState({ trabajadorId: '', eventoId: '', rolEvento: 'GARZON' });
  const [notas, setNotas] = useState({ puntualidad: 5, trato: 5, eficiencia: 5, manejoEquipos: 5 });
  const [mensaje, setMensaje] = useState('');

  const esTecnico = ['TECNICO_SONIDO', 'TECNICO_ILUMINACION', 'MONTAJISTA'].includes(form.rolEvento);
  const criterios = ['puntualidad', 'trato', 'eficiencia', ...(esTecnico ? ['manejoEquipos'] : [])];

  useEffect(() => {
    Promise.all([fetch(`${API_URL}/trabajadores`), fetch(`${API_URL}/eventos`)])
      .then(async ([resT, resE]) => setData({ trabajadores: await resT.json(), eventos: await resE.json() }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/evaluaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ...notas, trabajadorId: Number(form.trabajadorId), eventoId: Number(form.eventoId) }),
    }).then(res => setMensaje(res.ok ? 'Guardado exitosamente' : 'Error al guardar'));
  };

  return (
    <section className="panel">
      <h2>Evaluación de Personal</h2>
      <form onSubmit={handleSubmit}>
        <select required onChange={e => setForm({...form, trabajadorId: e.target.value})}>
          <option value="">Selecciona trabajador...</option>
          {data.trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>

        <select required onChange={e => setForm({...form, eventoId: e.target.value})}>
          <option value="">Selecciona evento...</option>
          {data.eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
        </select>

        <select onChange={e => setForm({...form, rolEvento: e.target.value})}>
          {['GARZON', 'ANIMADOR', 'TECNICO_SONIDO', 'MONTAJISTA'].map(rol => <option key={rol} value={rol}>{rol}</option>)}
        </select>

        <h3>Notas (1 al 5)</h3>
        {criterios.map(crit => (
          <div key={crit} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ width: '120px', textTransform: 'capitalize' }}>{crit}</label>
            <input type="number" min="1" max="5" value={notas[crit]} onChange={e => setNotas({...notas, [crit]: e.target.value})} style={{ width: '80px', margin: 0 }} />
          </div>
        ))}

        <button type="submit" className="btn">Guardar Evaluación</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </section>
  );
}

export default EvaluacionTrabajador;