import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';

function EventoCatalogo() {
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [lugares, setLugares] = useState([]);

  const [clienteId, setClienteId] = useState('');
  const [lugarId, setLugarId] = useState('');

  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [reclamos, setReclamos] = useState([]);
  const [promedio, setPromedio] = useState(null);

  const [autor, setAutor] = useState('');
  const [calificacion, setCalificacion] = useState(5);
  const [mensaje, setMensaje] = useState('');
  const [errorZod, setErrorZod] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/clientes`)
      .then((res) => res.json())
      .then((data) => setClientes(data));

    fetch(`${API_URL}/lugares`)
      .then((res) => res.json())
      .then((data) => setLugares(data));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (clienteId) params.append('clienteId', clienteId);
    if (lugarId) params.append('lugarId', lugarId);

    fetch(`${API_URL}/eventos?${params}`)
      .then((res) => res.json())
      .then((data) => setEventos(data));
  }, [clienteId, lugarId]);

  const verDetalle = (evento) => {
    setEventoSeleccionado(evento);
    setErrorZod(null); // Limpiar errores viejos

    // El endpoint anidado devuelve { reclamos, averageRating }
    fetch(`${API_URL}/eventos/${evento.id}/reclamos`)
      .then((res) => res.json())
      .then((data) => {
        setReclamos(data.reclamos);
        setPromedio(data.averageRating);
      });
  };

  const enviarReclamo = (e) => {
    e.preventDefault();
    setErrorZod(null);

    fetch(`${API_URL}/eventos/${eventoSeleccionado.id}/reclamos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor, calificacion: Number(calificacion), mensaje }),
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          setErrorZod(data.error || 'Revisa los datos del reclamo (mensaje mínimo 10 caracteres).');
          return;
        }

        setReclamos([data, ...reclamos]);
        setAutor('');
        setCalificacion(5);
        setMensaje('');
      });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Catálogo de Eventos</h2>

      {/* Sección de Filtros */}
      <div style={{ marginBottom: '20px' }}>
        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <select value={lugarId} onChange={(e) => setLugarId(e.target.value)} style={{ marginLeft: '10px' }}>
          <option value="">Todos los lugares</option>
          {lugares.map((l) => (
            <option key={l.id} value={l.id}>{l.nombre}</option>
          ))}
        </select>
      </div>

      {/* Lista de Eventos */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {eventos.map((evento) => (
          <li
            key={evento.id}
            onClick={() => verDetalle(evento)}
            style={{ cursor: 'pointer', color: '#0066cc', padding: '5px 0', textDecoration: 'underline' }}
          >
            🎉 {evento.nombre} — {new Date(evento.fecha).toLocaleDateString('es-CL')}
            {evento.confirmado ? ' ✅' : ' ⏳'}
          </li>
        ))}
      </ul>

      {/* Sección Dinámica: Detalles y Reclamos */}
      {eventoSeleccionado && (
        <div style={{ marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
          <h3>Detalles de {eventoSeleccionado.nombre}</h3>
          <p>
            Fecha: {new Date(eventoSeleccionado.fecha).toLocaleDateString('es-CL')}<br />
            Invitados: {eventoSeleccionado.numInvitados}<br />
            Presupuesto: {eventoSeleccionado.presupuesto ? `$${eventoSeleccionado.presupuesto.toLocaleString('es-CL')}` : 'Sin definir'}<br />
            Estado: {eventoSeleccionado.confirmado ? 'Confirmado (abono pagado)' : 'Pendiente de abono'}<br />
            Cliente: {eventoSeleccionado.cliente?.nombre}<br />
            Lugar: {eventoSeleccionado.lugar?.nombre}
          </p>

          <h4>Reclamos y sugerencias {promedio ? `(promedio: ${promedio.toFixed(1)} / 5)` : ''}</h4>
          {reclamos.length === 0 ? (
            <p>No hay reclamos aún. ¡Sé el primero!</p>
          ) : (
            <ul>
              {reclamos.map((r) => (
                <li key={r.id}>
                  <strong>{r.autor}</strong> ({r.calificacion}/5): {r.mensaje}
                </li>
              ))}
            </ul>
          )}

          {/* Formulario de envío */}
          <form onSubmit={enviarReclamo} style={{ marginTop: '15px' }}>
            <input
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Tu nombre"
              style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            <select
              value={calificacion}
              onChange={(e) => setCalificacion(e.target.value)}
              style={{ display: 'block', marginBottom: '10px', padding: '8px' }}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} estrella{n > 1 ? 's' : ''}</option>
              ))}
            </select>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu reclamo o sugerencia..."
              rows="3"
              style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            {errorZod && <p style={{ color: 'red', fontWeight: 'bold' }}>⚠️ {errorZod}</p>}
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>
              Agregar reclamo
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default EventoCatalogo;
