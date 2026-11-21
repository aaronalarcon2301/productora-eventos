import { useState, useEffect } from 'react';
import './personal.css';
import { apiFetch } from '../api/apiFetch';
import { DIAS, TURNOS, etiquetaRol } from './personalConstantes';

function MisDatos() {
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    apiFetch('/mi-perfil')
      .then((datos) => {
        if (!activo) return;
        setPerfil(datos);
        setForm({
          telefono: datos.telefono ?? '',
          comuna: datos.comuna ?? '',
          disponibilidadDias: datos.disponibilidadDias ?? [],
          disponibilidadTurno: datos.disponibilidadTurno ?? '',
        });
      })
      .catch((err) => activo && setAviso({ tipo: 'error', texto: err.message }));
    return () => {
      activo = false;
    };
  }, []);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const alternarDia = (dia) =>
    setForm((f) => ({
      ...f,
      disponibilidadDias: f.disponibilidadDias.includes(dia)
        ? f.disponibilidadDias.filter((d) => d !== dia)
        : [...f.disponibilidadDias, dia],
    }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);
    try {
      const body = {
        telefono: form.telefono,
        comuna: form.comuna,
        disponibilidadDias: form.disponibilidadDias,
      };
      if (form.disponibilidadTurno) body.disponibilidadTurno = form.disponibilidadTurno;
      const actualizado = await apiFetch('/mi-perfil', { method: 'PATCH', body });
      setPerfil(actualizado);
      setAviso({ tipo: 'ok', texto: 'Tus datos se actualizaron.' });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="pagina">
      <header className="pagina-cab">
        <h1>Mis datos</h1>
        <p>Mantén al día tu contacto y los días en que puedes trabajar.</p>
      </header>

      {aviso && <div className={`pers-alert ${aviso.tipo}`}>{aviso.texto}</div>}

      {perfil && form && (
        <div className="panel">
          <h2>{perfil.nombre}</h2>
          <dl className="tarjeta-datos" style={{ marginBottom: 20 }}>
            <dt>Cargo</dt>
            <dd>{etiquetaRol(perfil.rolPrincipal)}</dd>
            <dt>Correo</dt>
            <dd>{perfil.email}</dd>
            {perfil.aniosExperiencia != null && (
              <>
                <dt>Experiencia</dt>
                <dd>{perfil.aniosExperiencia} años</dd>
              </>
            )}
            {perfil.tallaUniforme && (
              <>
                <dt>Talla</dt>
                <dd>{perfil.tallaUniforme}</dd>
              </>
            )}
            {perfil.promedioGeneral != null && (
              <>
                <dt>Promedio</dt>
                <dd>★ {perfil.promedioGeneral.toFixed(1)}</dd>
              </>
            )}
          </dl>

          <form onSubmit={guardar}>
            <div className="grid-2">
              <div className="campo">
                <label>Teléfono</label>
                <input value={form.telefono} onChange={cambiar('telefono')} placeholder="+56 9 1234 5678" required />
              </div>
              <div className="campo">
                <label>Comuna</label>
                <input value={form.comuna} onChange={cambiar('comuna')} placeholder="Ej: Concepción" />
              </div>
            </div>

            <div className="campo">
              <label>Días en que puedes trabajar</label>
              <div className="chips" role="group" aria-label="Días disponibles">
                {DIAS.map((d) => (
                  <button
                    type="button"
                    key={d.valor}
                    className={`chip ${form.disponibilidadDias.includes(d.valor) ? 'activo' : ''}`}
                    onClick={() => alternarDia(d.valor)}
                  >
                    {d.corto}
                  </button>
                ))}
              </div>
            </div>

            <div className="campo">
              <label>Turno</label>
              <select value={form.disponibilidadTurno} onChange={cambiar('disponibilidadTurno')}>
                <option value="">Sin definir</option>
                {TURNOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="acciones">
              <button type="submit" className="btn" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default MisDatos;
