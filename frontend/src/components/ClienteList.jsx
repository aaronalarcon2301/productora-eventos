// Lista los clientes de la productora, mostrando cuántos eventos tiene cada uno.
// Este componente ya está resuelto - úsalo como referencia para construir el catálogo de Eventos.

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
  }, []); // se ejecuta una sola vez, al montar el componente

  if (cargando) return <p>Cargando clientes...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Clientes</h2>
      <ul>
        {clientes.map((cliente) => (
          <li key={cliente.id}>
            {cliente.nombre} — {cliente._count.eventos} evento(es)
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ClienteList;