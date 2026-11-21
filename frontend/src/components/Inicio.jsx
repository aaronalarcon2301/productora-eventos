export default function Inicio() {
  return (
    <div className="panel" style={{ textAlign: 'center', padding: '80px 20px', marginTop: '40px' }}>
      <h1 style={{ fontSize: '2.8rem', color: 'var(--cue)', marginBottom: '16px' }}>
        Bienvenido a NES Producciones
      </h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--ink-dim)', maxWidth: '640px', margin: '0 auto 16px' }}>
        Gestiona los presupuestos y el catálogo de eventos, la base de clientes y los lugares,
        el personal eventual con sus evaluaciones, y el inventario de equipos, desde un solo lugar.
      </p>
      <p style={{ fontSize: '1rem', color: 'var(--ink-dim)', maxWidth: '640px', margin: '0 auto' }}>
        Usa el menú superior para moverte entre las secciones.
      </p>
    </div>
  );
}
