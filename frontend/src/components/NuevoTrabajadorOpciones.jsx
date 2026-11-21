import { useRef, useState } from 'react';
import './personal.css';
import { importarExcel, descargarPlantilla } from '../api/archivos';

function NuevoTrabajadorOpciones({ onFormulario, onExcel, onCancelar }) {
  const entrada = useRef(null);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState('');

  const elegirArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError('');
    if (!/\.xlsx$/i.test(archivo.name)) {
      setError('Sube un archivo Excel en formato .xlsx (la plantilla).');
      return;
    }
    setLeyendo(true);
    try {
      const { datos, avisos } = await importarExcel(archivo);
      onExcel({ datos, avisos, archivo });
    } catch (err) {
      setError(err.message);
    } finally {
      setLeyendo(false);
    }
  };

  const bajarPlantilla = async () => {
    setError('');
    try {
      await descargarPlantilla();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="panel">
      <h2>Registrar trabajador</h2>
      <p className="subtitulo">¿Cómo quieres crearlo?</p>

      {error && <div className="pers-alert error">{error}</div>}

      <div className="opciones-nuevo">
        <div className="opcion-nuevo">
          <h3>Llenar el formulario</h3>
          <p>Ingresas los datos del trabajador directamente en el sistema.</p>
          <div className="acciones">
            <button type="button" className="btn" onClick={onFormulario}>Abrir formulario</button>
          </div>
        </div>

        <div className="opcion-nuevo">
          <h3>Cargar un archivo Excel</h3>
          <p>
            El trabajador te envía la plantilla llena. Se leen los datos, los revisas en el
            formulario y el archivo queda guardado en su ficha.
          </p>
          <div className="acciones">
            <button type="button" className="btn" disabled={leyendo} onClick={() => entrada.current?.click()}>
              {leyendo ? 'Leyendo…' : 'Elegir Excel'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={bajarPlantilla}>Descargar plantilla</button>
          </div>
          <input ref={entrada} type="file" accept=".xlsx" hidden onChange={elegirArchivo} />
        </div>
      </div>

      <div className="acciones" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}

export default NuevoTrabajadorOpciones;
