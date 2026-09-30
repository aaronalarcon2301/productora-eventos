// Lista los clientes de la productora, mostrando cuántos eventos tiene cada uno.

import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';

function ClienteList() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/clientes`)
      .then((res) => res.json())
      .then((data) => {
        setClientes(data);
        setCargando(false);
      })
      .catch(() => {
        setError('No se pudo conectar con el servidor');
        setCargando(false);
      });
  }, []);

  if (cargando) return <p className="empty">Cargando clientes…</p>;
  if (error) return <p className="alert alert-error">{error}</p>;

  return (
    <section className="panel">
      {clientes.length === 0 ? (
        <p className="empty">Todavía no hay clientes registrados.</p>
      ) : (
        <ul className="ledger">
          {clientes.map((cliente) => (
            <li key={cliente.id} className="ledger-row">
              <span className="name">{cliente.nombre}</span>
              <span className="meta">
                {cliente._count.eventos} evento{cliente._count.eventos === 1 ? '' : 's'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ClienteList;