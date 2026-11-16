import { useState } from 'react';
import { apiFetch } from '../api/apiFetch';
import { saveSession } from '../api/session';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e) => {
    e.preventDefault();

    setError('');
    setCargando(true);

    try {
      const sesion = await apiFetch('/auth/login', {
        method: 'POST',
        body: {
          email: email.trim(),
          password
        }
      });

      saveSession(sesion);
      onLogin(sesion.usuario);

    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-layout">
      <section className="login-intro">
        <p className="login-eyebrow">
          NES PRODUCCIONES
        </p>

        <h1>Bienvenido a tu espacio de trabajo.</h1>

        <p>
          Administra eventos, presupuestos y solicitudes
          desde una plataforma organizada.
        </p>

        <div className="login-roles">
          <div>
            <strong>Trabajador</strong>
            <span>
              Solicita eventos y consulta los presupuestos aprobados.
            </span>
          </div>

          <div>
            <strong>Gerente</strong>
            <span>
              Revisa presupuestos y administra la productora.
            </span>
          </div>
        </div>
      </section>

      <section className="panel login-panel">
        <h2>Iniciar sesión</h2>
        <p>Ingresa tus credenciales para continuar.</p>

        <form onSubmit={iniciarSesion} className="login-form">
          <label htmlFor="email">Correo electrónico</label>

          <input
            id="email"
            type="email"
            placeholder="correo@nes.cl"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Contraseña</label>

          <input
            id="password"
            type="password"
            placeholder="Contraseña"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="btn login-submit"
            type="submit"
            disabled={cargando}
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-hint">
          Los permisos se asignan automáticamente según tu cuenta.
        </p>
      </section>
    </main>
  );
}