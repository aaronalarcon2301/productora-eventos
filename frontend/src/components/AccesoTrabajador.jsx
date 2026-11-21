import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';

const LETRAS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarClave() {
  const azar = new Uint32Array(12);
  crypto.getRandomValues(azar);
  return Array.from(azar, (n) => LETRAS[n % LETRAS.length]).join('');
}

function AccesoTrabajador({ trabajador, onCerrar }) {
  const [acceso, setAcceso] = useState(null);
  const [password, setPassword] = useState('');
  const [aviso, setAviso] = useState(null);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    let activo = true;
    apiFetch(`/trabajadores/${trabajador.id}/acceso`)
      .then((datos) => activo && setAcceso(datos))
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, [trabajador.id]);

  const guardar = async (e) => {
    e.preventDefault();
    setAviso(null);
    if (password.length < 10) {
      setAviso({ tipo: 'error', texto: 'La contraseña debe tener al menos 10 caracteres.' });
      return;
    }
    setTrabajando(true);
    try {
      const nuevo = await apiFetch(`/trabajadores/${trabajador.id}/acceso`, {
        method: 'PUT',
        body: { password },
      });
      setAcceso(nuevo);
      setAviso({
        tipo: 'ok',
        texto: 'Acceso guardado. Entrégale la clave al trabajador: después no se puede volver a ver.',
      });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setTrabajando(false);
    }
  };

  const desactivar = async () => {
    if (!window.confirm(`¿Desactivar el acceso de ${trabajador.nombre}? Se cerrará su sesión.`)) return;
    setTrabajando(true);
    setAviso(null);
    try {
      setAcceso(await apiFetch(`/trabajadores/${trabajador.id}/acceso`, { method: 'DELETE' }));
      setPassword('');
      setAviso({ tipo: 'ok', texto: 'Acceso desactivado.' });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setTrabajando(false);
    }
  };

  const sinCorreo = acceso && !acceso.tieneAcceso && !acceso.email;
  const etiquetaBoton = !acceso?.tieneAcceso ? 'Crear acceso' : acceso.activo ? 'Cambiar clave' : 'Reactivar con esta clave';

  return (
    <section className="panel">
      <h2>Acceso al sistema · {trabajador.nombre}</h2>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      {!acceso ? (
        !aviso && <p className="pers-vacio">Cargando…</p>
      ) : sinCorreo ? (
        <div className="pers-alert error">
          Este trabajador no tiene correo. Agrégalo en “Editar” para poder darle acceso.
        </div>
      ) : (
        <>
          <p className="meta" style={{ color: 'var(--ink-dim)' }}>
            {acceso.tieneAcceso
              ? acceso.activo
                ? 'Tiene acceso activo.'
                : 'Su acceso está desactivado.'
              : 'Todavía no tiene acceso.'}{' '}
            Inicia sesión con el correo <strong>{acceso.email}</strong> y ve sus asignaciones, evaluaciones y datos.
          </p>

          <form onSubmit={guardar}>
            <div className="campo">
              <label>{acceso.tieneAcceso ? 'Nueva contraseña' : 'Contraseña'} (mínimo 10 caracteres)</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                placeholder="Escribe una o genera una"
              />
            </div>
            <div className="acciones">
              <button type="submit" className="btn" disabled={trabajando}>
                {etiquetaBoton}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setPassword(generarClave())}>
                Generar clave
              </button>
              {acceso.tieneAcceso && acceso.activo && (
                <button type="button" className="btn btn-danger" disabled={trabajando} onClick={desactivar}>
                  Desactivar acceso
                </button>
              )}
            </div>
          </form>
        </>
      )}

      <div className="acciones" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-ghost" onClick={onCerrar}>
          Volver
        </button>
      </div>
    </section>
  );
}

export default AccesoTrabajador;
