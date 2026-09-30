import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';

const ROLES = [
  'GARZON', 'ANIMADOR', 'ANFITRION', 'ASEO_LOGISTICA', 'SEGURIDAD',
  'TECNICO_SONIDO', 'TECNICO_ILUMINACION', 'MONTAJISTA',
];
const ROLES_TECNICOS = ['TECNICO_SONIDO', 'TECNICO_ILUMINACION', 'MONTAJISTA'];

const GRUPOS = [
  {
    titulo: 'Puntualidad',
    items: [
      ['llegada', 'Llegada a la hora acordada'],
      ['cumplimientoHorarios', 'Cumplimiento de horarios durante el evento'],
      ['tiemposPreparacion', 'Tiempos de montaje/preparación'],
    ],
  },
  {
    titulo: 'Trato con el cliente',
    items: [
      ['comunicacion', 'Comunicación respetuosa y profesional'],
      ['atencion', 'Disposición para atender solicitudes'],
      ['conducta', 'Actitud adecuada durante el evento'],
    ],
  },
  {
    titulo: 'Eficiencia',
    items: [
      ['cumplimiento', 'Cumplimiento de tareas asignadas'],
      ['autonomia', 'Autonomía (sin supervisión constante)'],
      ['resolucion', 'Resolución de problemas o imprevistos'],
    ],
  },
];

const GRUPO_TECNICO = {
  titulo: 'Manejo de equipos (solo roles técnicos)',
  items: [
    ['usoEquipos', 'Uso correcto de los equipos'],
    ['cuidadoEquipos', 'Cuidado y manipulación responsable'],
    ['resolucionTecnica', 'Resolución de problemas técnicos'],
  ],
};

const TODOS_LOS_ITEMS = [...GRUPOS, GRUPO_TECNICO].flatMap((g) => g.items);

function nombreComentario(campo) {
  return 'comentario' + campo[0].toUpperCase() + campo.slice(1);
}

function valoresIniciales() {
  const v = {};
  for (const [campo] of TODOS_LOS_ITEMS) {
    v[campo] = 5;
    v[nombreComentario(campo)] = '';
  }
  return v;
}

function EvaluacionTrabajador() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [eventos, setEventos] = useState([]);

  const [trabajadorId, setTrabajadorId] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [rolEvento, setRolEvento] = useState('GARZON');
  const [valores, setValores] = useState(valoresIniciales());

  const [mensaje, setMensaje] = useState('');

  const esTecnico = ROLES_TECNICOS.includes(rolEvento);

  useEffect(() => {
    fetch(`${API_URL}/trabajadores`).then((res) => res.json()).then(setTrabajadores);
    fetch(`${API_URL}/eventos`).then((res) => res.json()).then(setEventos);
  }, []);

  // Limpiar valores al cambiar de trabajador
  useEffect(() => {
    setValores(valoresIniciales());
    setMensaje('');
  }, [trabajadorId]);

  const setCampo = (campo, valor) => setValores((v) => ({ ...v, [campo]: valor }));

  const renderSubindicador = ([campo, label]) => {
    const campoComentario = nombreComentario(campo);
    return (
      <div key={campo} style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '13px' }}>{label}</label>
        <select
          value={valores[campo]}
          onChange={(e) => setCampo(campo, Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Comentario (obligatorio si es 1, 2 o 5)"
          value={valores[campoComentario]}
          onChange={(e) => setCampo(campoComentario, e.target.value)}
          style={{ marginLeft: '8px', width: '320px' }}
        />
      </div>
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMensaje('');

    const body = {
      trabajadorId: Number(trabajadorId),
      eventoId: Number(eventoId),
      rolEvento,
    };

    const grupos = esTecnico ? [...GRUPOS, GRUPO_TECNICO] : GRUPOS;
    for (const g of grupos) {
      for (const [campo] of g.items) {
        body[campo] = valores[campo];
        const comentario = valores[nombreComentario(campo)]?.trim();
        if (comentario) body[nombreComentario(campo)] = comentario;
      }
    }

    fetch(`${API_URL}/evaluaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          // El cambio está aquí: mostramos un solo mensaje general si hay errores de validación
          const detalle = data.detalles 
            ? 'Por favor, selecciona trabajador/evento y justifica con comentarios las notas 1, 2 o 5.' 
            : null;
            
          setMensaje(detalle || data.error || 'Error al guardar la evaluación');
          return;
        }
        setMensaje(`Evaluación guardada (promedio: ${data.promedioEvaluacion.toFixed(1)} / 5)`);
        setValores(valoresIniciales());
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
        </select>{' '}

        <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
          <option value="">-- Evento --</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.nombre}</option>
          ))}
        </select>{' '}

        <select value={rolEvento} onChange={(e) => setRolEvento(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {GRUPOS.map((g) => (
          <fieldset key={g.titulo} style={{ marginTop: '16px' }}>
            <legend><strong>{g.titulo}</strong></legend>
            {g.items.map(renderSubindicador)}
          </fieldset>
        ))}

        {esTecnico && (
          <fieldset style={{ marginTop: '16px' }}>
            <legend><strong>{GRUPO_TECNICO.titulo}</strong></legend>
            {GRUPO_TECNICO.items.map(renderSubindicador)}
          </fieldset>
        )}

        <br />
        <button type="submit">Guardar</button>
      </form>

      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}

export default EvaluacionTrabajador;