export default function Inicio({ setVista }) {
  return (
    <div className="panel" style={{ textAlign: 'center', padding: '80px 20px', marginTop: '40px' }}>
      <h1 style={{ fontSize: '2.8rem', color: 'var(--cue)', marginBottom: '16px' }}>
        Bienvenido a NES Producciones
      </h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--ink-dim)', maxWidth: '600px', margin: '0 auto 40px' }}>
        Gestione el catálogo de eventos, administra la base de clientes, 
        revisa los lugares disponibles y evalúa al personal eventual desde un solo lugar.
      </p>
      
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button className="btn" onClick={() => setVista('eventos')}>
          Ver Catálogo de Eventos
        </button>
        <button className="btn btn-ghost" onClick={() => setVista('personal')}>
          Evaluar Personal
        </button>
      </div>
    </div>
  );
}