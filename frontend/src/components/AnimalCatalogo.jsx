import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';

function AnimalCatalogo() {
  const [animales, setAnimales] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [recintos, setRecintos] = useState([]);

  const [especieId, setEspecieId] = useState('');
  const [recintoId, setRecintoId] = useState('');

  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [errorZod, setErrorZod] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/especies`)
      .then((res) => res.json())
      .then((data) => setEspecies(data));

    fetch(`${API_URL}/recintos`)
      .then((res) => res.json())
      .then((data) => setRecintos(data));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (especieId) params.append('especieId', especieId);
    if (recintoId) params.append('recintoId', recintoId);

    fetch(`${API_URL}/animals?${params}`)
      .then((res) => res.json())
      .then((data) => setAnimales(data));
  }, [especieId, recintoId]);

  const verDetalle = (animal) => {
    setAnimalSeleccionado(animal);
    setErrorZod(null); // Limpiar errores viejos
    
    fetch(`${API_URL}/animals/${animal.id}/comments`)
      .then((res) => res.json())
      .then((data) => setComentarios(data));
  };

  const enviarComentario = (e) => {
    e.preventDefault();
    setErrorZod(null);

    fetch(`${API_URL}/animals/${animalSeleccionado.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: nuevoComentario }), 
    })
      .then(async (res) => {
        const data = await res.json();
        
        if (!res.ok) {
          setErrorZod(data.error || 'El comentario es muy corto (mínimo 10 caracteres).');
          return;
        }

        setComentarios([...comentarios, data]);
        setNuevoComentario('');
      });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Catálogo de Animales</h2>

      {/* Sección de Filtros */}
      <div style={{ marginBottom: '20px' }}>
        <select value={especieId} onChange={(e) => setEspecieId(e.target.value)}>
          <option value="">Todas las especies</option>
          {especies.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>

        <select value={recintoId} onChange={(e) => setRecintoId(e.target.value)} style={{ marginLeft: '10px' }}>
          <option value="">Todos los recintos</option>
          {recintos.map((r) => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </select>
      </div>

      {/* Lista de Animales */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {animales.map((animal) => (
          <li 
            key={animal.id} 
            onClick={() => verDetalle(animal)}
            style={{ cursor: 'pointer', color: '#0066cc', padding: '5px 0', textDecoration: 'underline' }}
          >
            🐾 {animal.nombre}
          </li>
        ))}
      </ul>

      {/* Sección Dinámica: Detalles y Comentarios */}
      {animalSeleccionado && (
        <div style={{ marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
          <h3>Detalles de {animalSeleccionado.nombre}</h3>
          
          <h4>Comentarios:</h4>
          {comentarios.length === 0 ? (
            <p>No hay comentarios aún. ¡Sé el primero!</p>
          ) : (
            <ul>
              {comentarios.map((c, index) => (
                <li key={index}>{c.comment}</li> 
              ))}
            </ul>
          )}

          {/* Formulario de envío */}
          <form onSubmit={enviarComentario} style={{ marginTop: '15px' }}>
            <textarea 
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Escribe un comentario..."
              rows="3"
              style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            {errorZod && <p style={{ color: 'red', fontWeight: 'bold' }}>⚠️ {errorZod}</p>}
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>
              Agregar comentario
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AnimalCatalogo;