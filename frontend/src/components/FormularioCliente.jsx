import { useState } from 'react';
import { apiFetch } from '../api/apiFetch';
import './personal.css';

function FormularioCliente({ cliente, onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    nombre: cliente?.nombre ?? '',
    rut: cliente?.rut ?? '',
    email: cliente?.email ?? '',
    telefono: cliente?.telefono ?? '',
  });
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await apiFetch(cliente ? `/clientes/${cliente.id}` : '/clientes', {
        method: cliente ? 'PUT' : 'POST',
        body: {
          nombre: form.nombre.trim(),
          rut: form.rut.trim(),
          email: form.email.trim() || null,
          telefono: form.telefono.trim() || null,
        },
      });
      onGuardado(cliente ? 'Cliente actualizado.' : 'Cliente agregado.');
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h2>{cliente ? 'Editar cliente' : 'Nuevo cliente'}</h2>
      {error && <div className="pers-alert error">{error}</div>}
      <form onSubmit={guardar}>
        <div className="campo">
          <label>Nombre *</label>
          <input required value={form.nombre} onChange={cambiar('nombre')} placeholder="Nombre o razón social" />
        </div>
        <div className="campo">
          <label>RUT *</label>
          <input required value={form.rut} onChange={cambiar('rut')} placeholder="12.345.678-5" />
          <span className="ayuda">Con o sin puntos. Se valida el dígito verificador.</span>
        </div>
        <div className="grid-2">
          <div className="campo">
            <label>Email</label>
            <input type="email" value={form.email} onChange={cambiar('email')} placeholder="contacto@empresa.cl" />
          </div>
          <div className="campo">
            <label>Teléfono</label>
            <input type="tel" value={form.telefono} onChange={cambiar('telefono')} placeholder="+56 9 1234 5678" />
          </div>
        </div>
        <div className="acciones">
          <button type="submit" className="btn" disabled={guardando}>{cliente ? 'Guardar cambios' : 'Guardar cliente'}</button>
          <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        </div>
      </form>
    </section>
  );
}

export default FormularioCliente;
