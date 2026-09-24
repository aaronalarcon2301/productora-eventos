// Lista los lugares (salones, quintas, etc.) donde la productora realiza eventos.
// Mismo patrón que ClienteList. 

import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';

function LugarList() {
  const [lugares, setLugares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/lugares`)
      .then((res) => res.json())
      .then((data) => {
        setLugares(data);
        setCargando(false);
      })
      .catch(() => {
        setError('No se pudo conectar con el servidor');
        setCargando(false);
      });
  }, []);

  if (cargando) return <p>Cargando lugares...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Lugares</h2>
      <ul>
        {lugares.map((lugar) => (
          <li key={lugar.id}>
            {lugar.nombre} ({lugar.ubicacion}) — {lugar._count.eventos} evento(es)
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LugarList;