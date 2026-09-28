import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';

function EvaluacionTrabajador() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [eventos, setEventos] = useState([]);

  const [trabajadorId, setTrabajadorId] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [rolEvento, setRolEvento] = useState('GARZON');

  const [puntualidad, setPuntualidad] = useState(5);
  const [trato, setTrato] = useState(5);
  const [eficiencia, setEficiencia] = useState(5);
  const [manejoEquipos, setManejoEquipos] = useState(5);

  const [comentarioPuntualidad, setComentarioPuntualidad] = useState('');
  const [comentarioTrato, setComentarioTrato] = useState('');
  const [comentarioEficiencia, setComentarioEficiencia] = useState('');
  const [comentarioManejoEquipos, setComentarioManejoEquipos] = useState('');

  const [mensaje, setMensaje] = useState('');

  const esTecnico = ['TECNICO_SONIDO', 'TECNICO_ILUMINACION', 'MONTAJISTA'].includes(rolEvento);

  useEffect(() => {
    fetch(`${API_URL}/trabajadores`).then((res) => res.json()).then(setTrabajadores);
    fetch(`${API_URL}/eventos`).then((res) => res.json()).then(setEventos);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const body = {
      trabajadorId: Number(trabajadorId),
      eventoId: Number(eventoId),
      rolEvento,
      puntualidad: Number(puntualidad),
      comentarioPuntualidad: comentarioPuntualidad || undefined,
      trato: Number(trato),
      comentarioTrato: comentarioTrato || undefined,
      eficiencia: Number(eficiencia),
      comentarioEficiencia: comentarioEficiencia || undefined,
    };

    if (esTecnico) {
      body.manejoEquipos = Number(manejoEquipos);
      body.comentarioManejoEquipos = comentarioManejoEquipos || undefined;
    }

    fetch(`${API_URL}/evaluaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setMensaje(data.error || 'Error al guardar la evaluación');
          return;
        }
        setMensaje('Evaluación guardada correctamente');
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Evaluar trabajador</h2>

      <form onSubmit={handleSubmit}>
        <select value={trabajadorId} onChange={(e) => setTrabajadorId(e.target.value)}>
          <option value="">-- Trabajador --</option>
          {trabajadores.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>

        <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
          <option value="">-- Evento --</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.nombre}</option>
          ))}
        </select>

        <select value={rolEvento} onChange={(e) => setRolEvento(e.target.value)}>
          <option value="GARZON">GARZON</option>
          <option value="ANIMADOR">ANIMADOR</option>
          <option value="ANFITRION">ANFITRION</option>
          <option value="ASEO_LOGISTICA">ASEO_LOGISTICA</option>
          <option value="SEGURIDAD">SEGURIDAD</option>
          <option value="TECNICO_SONIDO">TECNICO_SONIDO</option>
          <option value="TECNICO_ILUMINACION">TECNICO_ILUMINACION</option>
          <option value="MONTAJISTA">MONTAJISTA</option>
        </select>

        <br /><br />

        <label>Puntualidad: </label>
        <input type="number" min="1" max="5" value={puntualidad} onChange={(e) => setPuntualidad(e.target.value)} />
        <input type="text" placeholder="Comentario" value={comentarioPuntualidad} onChange={(e) => setComentarioPuntualidad(e.target.value)} />
        <br />

        <label>Trato: </label>
        <input type="number" min="1" max="5" value={trato} onChange={(e) => setTrato(e.target.value)} />
        <input type="text" placeholder="Comentario" value={comentarioTrato} onChange={(e) => setComentarioTrato(e.target.value)} />
        <br />

        <label>Eficiencia: </label>
        <input type="number" min="1" max="5" value={eficiencia} onChange={(e) => setEficiencia(e.target.value)} />
        <input type="text" placeholder="Comentario" value={comentarioEficiencia} onChange={(e) => setComentarioEficiencia(e.target.value)} />
        <br />

        {esTecnico && (
          <>
            <label>Manejo de equipos: </label>
            <input type="number" min="1" max="5" value={manejoEquipos} onChange={(e) => setManejoEquipos(e.target.value)} />
            <input type="text" placeholder="Comentario" value={comentarioManejoEquipos} onChange={(e) => setComentarioManejoEquipos(e.target.value)} />
            <br />
          </>
        )}

        <br />
        <button type="submit">Guardar</button>
      </form>

      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}

export default EvaluacionTrabajador;