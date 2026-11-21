import { useState } from 'react';
import { apiFetch } from '../api/apiFetch';
import { saveSession } from '../api/session';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

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

<div className="login-password-field">
  <input
    id="password"
    type={mostrarPassword ? 'text' : 'password'}
    placeholder="Contraseña"
    autoComplete="current-password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />

  <button
    type="button"
    className="login-password-toggle"
    onClick={() => setMostrarPassword(!mostrarPassword)}
    aria-label={
      mostrarPassword
        ? 'Ocultar contraseña'
        : 'Mostrar contraseña'
    }
    aria-pressed={mostrarPassword}
    title={
      mostrarPassword
        ? 'Ocultar contraseña'
        : 'Mostrar contraseña'
    }
  >
    {mostrarPassword ? (
      // Ojo tachado: contraseña visible
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-3.1 4.2" />
        <path d="M6.6 6.6C3.5 8.5 2 12 2 12s3 7 10 7c1.7 0 3.2-.4 4.4-1" />
        <path d="M2 2l20 20" />
      </svg>
    ) : (
      // Ojo normal: contraseña oculta
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
</div>

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