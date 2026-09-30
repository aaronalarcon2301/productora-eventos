// Lista los lugares (salones, quintas, etc.) donde la productora realiza eventos.

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

  if (cargando) return <p className="empty">Cargando lugares…</p>;
  if (error) return <p className="alert alert-error">{error}</p>;

  return (
    <section className="panel">
      {lugares.length === 0 ? (
        <p className="empty">Todavía no hay lugares registrados.</p>
      ) : (
        <ul className="ledger">
          {lugares.map((lugar) => (
            <li key={lugar.id} className="ledger-row">
              <span className="name">
                {lugar.nombre}
                {lugar.ubicacion && <span className="meta"> — {lugar.ubicacion}</span>}
              </span>
              <span className="meta">
                {lugar._count.eventos} evento{lugar._count.eventos === 1 ? '' : 's'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default LugarList;