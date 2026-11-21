import { useRef, useState, useEffect } from 'react';
import './personal.css';
import {
  ACEPTAR,
  listarArchivos,
  subirArchivo,
  eliminarArchivo,
  descargarArchivo
} from '../api/archivos';

function tamanoLegible(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fechaLegible(iso) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ArchivosTrabajador({ trabajadorId }) {
  const entrada = useRef(null);
  const [archivos, setArchivos] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    listarArchivos(trabajadorId)
      .then((datos) => activo && setArchivos(datos))
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, [trabajadorId, version]);

  const subir = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setAviso(null);
    setSubiendo(true);
    try {
      await subirArchivo(trabajadorId, archivo);
      setAviso({ tipo: 'ok', texto: 'Archivo guardado.' });
      setVersion((v) => v + 1);
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setSubiendo(false);
    }
  };

  const bajar = async (archivo) => {
    setAviso(null);
    try {
      await descargarArchivo(trabajadorId, archivo);
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  const borrar = async (archivo) => {
    if (!window.confirm(`¿Eliminar «${archivo.nombre}»?`)) return;
    setAviso(null);
    try {
      await eliminarArchivo(trabajadorId, archivo.id);
      setVersion((v) => v + 1);
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    }
  };

  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <h2>Archivos</h2>
      <p className="ayuda" style={{ marginTop: 0 }}>
        Excel, PDF, imágenes o Word de este trabajador (máximo 5 MB cada uno).
      </p>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      {archivos.length === 0 ? (
        <p className="pers-vacio">Todavía no hay archivos guardados.</p>
      ) : (
        archivos.map((a) => (
          <div key={a.id} className="fila-personal">
            <div>
              <div className="principal">{a.nombre}</div>
              <div className="meta">{tamanoLegible(a.tamano)} · {fechaLegible(a.createdAt)}</div>
            </div>
            <div className="acciones">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => bajar(a)}>Descargar</button>
              <button type="button" className="link-peligro" onClick={() => borrar(a)}>Eliminar</button>
            </div>
          </div>
        ))
      )}

      <div className="acciones" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-sm" disabled={subiendo} onClick={() => entrada.current?.click()}>
          {subiendo ? 'Subiendo…' : 'Subir archivo'}
        </button>
        <input ref={entrada} type="file" accept={ACEPTAR} hidden onChange={subir} />
      </div>
    </div>
  );
}

export default ArchivosTrabajador;
