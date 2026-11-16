
import { useEffect, useState } from 'react';
import { apiFetch } from '../api/apiFetch';

const pesos = (numero) =>
  `$${Number(numero || 0).toLocaleString('es-CL')}`;

export default function CotizarEvento({
  onCancelar,
  onGuardado
}) {

  const [catalogos, setCatalogos] = useState({
    clientes: [],
    lugares: []
  });

  const [inventario, setInventario] = useState([]);
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    nombre: '',
    fecha: '',
    numInvitados: '',
    clienteId: '',
    lugarId: '',
    costoServicios: '0'
  });

  const [equipoId, setEquipoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [dias, setDias] = useState(1);

  const [mostrarClienteNuevo, setMostrarClienteNuevo] =
    useState(false);

  const [clienteNuevo, setClienteNuevo] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });

  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardandoCliente, setGuardandoCliente] =
    useState(false);

  const [cargandoInventario, setCargandoInventario] =
    useState(false);

  const cambiar = (campo, valor) => {
    setForm(anterior => ({
      ...anterior,
      [campo]: valor
    }));
  };

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const respuesta = await apiFetch('/catalogos');

        setCatalogos({
          clientes: Array.isArray(respuesta?.clientes)
            ? respuesta.clientes
            : [],
          lugares: Array.isArray(respuesta?.lugares)
            ? respuesta.lugares
            : []
        });

      } catch (err) {
        console.error('Error al cargar catálogos:', err);
        setError(err.message);
      }
    };

    cargarCatalogos();
  }, []);

  useEffect(() => {
    let activo = true;

    const cargarEquipos = async () => {
      setCargandoInventario(true);

      try {
        const parametro = form.fecha
          ? `?fecha=${form.fecha}&soloActivos=true`
          : '?soloActivos=true';

        const respuesta = await apiFetch(
          `/equipos${parametro}`
        );

        if (activo) {
          setInventario(
            Array.isArray(respuesta) ? respuesta : []
          );
        }

      } catch (err) {
        if (activo) {
          console.error('Error al cargar equipos:', err);
          setInventario([]);
          setError(err.message);
        }

      } finally {
        if (activo) {
          setCargandoInventario(false);
        }
      }
    };

    cargarEquipos();

    return () => {
      activo = false;
    };

  }, [form.fecha]);

  const registrarCliente = async () => {
    if (clienteNuevo.nombre.trim().length < 2) {
      setError('Ingresa el nombre del cliente.');
      return;
    }

    setGuardandoCliente(true);
    setError('');

    try {
      const nuevo = await apiFetch('/catalogos/clientes', {
        method: 'POST',
        body: {
          nombre: clienteNuevo.nombre.trim(),

          ...(clienteNuevo.email.trim()
            ? { email: clienteNuevo.email.trim() }
            : {}),

          ...(clienteNuevo.telefono.trim()
            ? { telefono: clienteNuevo.telefono.trim() }
            : {})
        }
      });

      setCatalogos(anterior => ({
        ...anterior,
        clientes: [...anterior.clientes, nuevo].sort(
          (a, b) =>
            a.nombre.localeCompare(b.nombre, 'es')
        )
      }));

      cambiar('clienteId', String(nuevo.id));

      setMostrarClienteNuevo(false);

      setClienteNuevo({
        nombre: '',
        email: '',
        telefono: ''
      });

    } catch (err) {
      setError(err.message);

    } finally {
      setGuardandoCliente(false);
    }
  };

  const equipoSeleccionado = inventario.find(
    equipo => String(equipo.id) === equipoId
  );

  const agregarEquipo = () => {
    setError('');

    if (!form.fecha) {
      setError(
        'Primero debes seleccionar la fecha del evento.'
      );
      return;
    }

    if (!equipoSeleccionado) {
      setError('Selecciona un equipo.');
      return;
    }

    if (equipoSeleccionado.precioArriendoDia == null) {
      setError(
        'Este equipo no tiene un precio de arriendo configurado.'
      );
      return;
    }

    const cantidadNumero = Number(cantidad);
    const diasNumero = Number(dias);

    if (
      !Number.isInteger(cantidadNumero) ||
      cantidadNumero < 1 ||
      cantidadNumero > equipoSeleccionado.disponible
    ) {
      setError(
        'La cantidad solicitada supera el stock disponible.'
      );
      return;
    }

    if (
      !Number.isInteger(diasNumero) ||
      diasNumero < 1 ||
      diasNumero > 30
    ) {
      setError(
        'Los días de arriendo deben estar entre 1 y 30.'
      );
      return;
    }

    const yaAgregado = items.some(
      item => item.equipoId === equipoSeleccionado.id
    );

    if (yaAgregado) {
      setError(
        'Este equipo ya fue agregado a la cotización.'
      );
      return;
    }

    const nuevoItem = {
      equipoId: equipoSeleccionado.id,
      nombre: equipoSeleccionado.nombre,
      cantidad: cantidadNumero,
      diasArriendo: diasNumero,
      precioUnitarioDia:
        equipoSeleccionado.precioArriendoDia
    };

    setItems(anteriores => [
      ...anteriores,
      nuevoItem
    ]);

    setEquipoId('');
    setCantidad(1);
    setDias(1);
  };

  const eliminarItem = (id) => {
    setItems(anteriores =>
      anteriores.filter(
        item => item.equipoId !== id
      )
    );
  };

  const totalEquipos = items.reduce(
    (suma, item) =>
      suma +
      item.precioUnitarioDia *
      item.cantidad *
      item.diasArriendo,
    0
  );

  const totalServicios = Number(
    form.costoServicios || 0
  );

  const total = totalEquipos + totalServicios;
  const enviarCotizacion = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.clienteId) {
      setError('Selecciona un cliente.');
      return;
    }

    if (!form.lugarId) {
      setError('Selecciona un lugar.');
      return;
    }

    if (
      !Number.isSafeInteger(totalServicios) ||
      totalServicios < 0 ||
      totalServicios > 500000000
    ) {
      setError('El costo de servicios no es válido.');
      return;
    }

    if (total <= 0) {
      setError(
        'El presupuesto debe ser mayor a cero.'
      );
      return;
    }

    setGuardando(true);

    try {
      const nuevoEvento = await apiFetch(
        '/cotizaciones/solicitar',
        {
          method: 'POST',

          body: {
            nombre: form.nombre.trim(),

            fecha: `${form.fecha}T12:00:00.000Z`,

            numInvitados: Number(
              form.numInvitados
            ),

            clienteId: Number(
              form.clienteId
            ),

            lugarId: Number(
              form.lugarId
            ),

            costoServicios: totalServicios,

            equipos: items.map(item => ({
              equipoId: item.equipoId,
              cantidad: item.cantidad,
              diasArriendo: item.diasArriendo
            }))
          }
        }
      );

      onGuardado(nuevoEvento);

    } catch (err) {
      console.error(
        'Error al enviar cotización:',
        err
      );

      setError(err.message);

    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nueva cotización"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.78)',
        zIndex: 1000,
        overflowY: 'auto',
        padding: '30px 12px'
      }}
    >

      <section
        className="panel"
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: 28
        }}
      >

        <header className="page-heading">
          <div>
            <h2>Nueva cotización</h2>

            <p>
              Prepara un presupuesto para revisión
              del gerente.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancelar}
            disabled={guardando}
          >
            Cerrar
          </button>
        </header>

        {error && (
          <p
            className="notice notice-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <form
          onSubmit={enviarCotizacion}
          className="login-form"
        >

          <h3>1. Datos del evento</h3>

          <label htmlFor="nombre-cotizacion">
            Nombre del evento
          </label>

          <input
            id="nombre-cotizacion"
            required
            minLength={2}
            maxLength={100}
            value={form.nombre}
            onChange={e =>
              cambiar('nombre', e.target.value)
            }
            placeholder="Ej: Matrimonio Juan y María"
          />

          <label htmlFor="fecha-cotizacion">
            Fecha del evento
          </label>

          <input
            id="fecha-cotizacion"
            type="date"
            required
            value={form.fecha}
            onChange={e => {
              cambiar('fecha', e.target.value);
              setItems([]);
              setEquipoId('');
            }}
          />

          <label htmlFor="invitados-cotizacion">
            Número de invitados
          </label>

          <input
            id="invitados-cotizacion"
            type="number"
            min="1"
            required
            value={form.numInvitados}
            onChange={e =>
              cambiar('numInvitados', e.target.value)
            }
          />

          <h3>2. Cliente y lugar</h3>

          <label htmlFor="cliente-cotizacion">
            Cliente
          </label>

          <select
            id="cliente-cotizacion"
            required
            value={form.clienteId}
            onChange={e =>
              cambiar('clienteId', e.target.value)
            }
          >
            <option value="">
              Seleccionar cliente
            </option>

            {catalogos.clientes.map(cliente => (
              <option
                key={cliente.id}
                value={cliente.id}
              >
                {cliente.nombre}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setMostrarClienteNuevo(
                anterior => !anterior
              )
            }
          >
            + Registrar cliente nuevo
          </button>

          {mostrarClienteNuevo && (
            <div
              className="panel"
              style={{ marginTop: 10 }}
            >
              <h3>Nuevo cliente</h3>

              <label>Nombre</label>

              <input
                value={clienteNuevo.nombre}
                onChange={e =>
                  setClienteNuevo({
                    ...clienteNuevo,
                    nombre: e.target.value
                  })
                }
                placeholder="Nombre completo"
              />

              <label>Correo (opcional)</label>

              <input
                type="email"
                value={clienteNuevo.email}
                onChange={e =>
                  setClienteNuevo({
                    ...clienteNuevo,
                    email: e.target.value
                  })
                }
                placeholder="correo@ejemplo.cl"
              />

              <label>Teléfono (opcional)</label>

              <input
                value={clienteNuevo.telefono}
                onChange={e =>
                  setClienteNuevo({
                    ...clienteNuevo,
                    telefono: e.target.value
                  })
                }
                placeholder="+56 9..."
              />

              <button
                type="button"
                className="btn"
                disabled={guardandoCliente}
                onClick={registrarCliente}
              >
                {guardandoCliente
                  ? 'Guardando...'
                  : 'Guardar cliente'}
              </button>
            </div>
          )}

          <label htmlFor="lugar-cotizacion">
            Lugar
          </label>

          <select
            id="lugar-cotizacion"
            required
            value={form.lugarId}
            onChange={e =>
              cambiar('lugarId', e.target.value)
            }
          >
            <option value="">
              Seleccionar lugar
            </option>

            {catalogos.lugares.map(lugar => (
              <option
                key={lugar.id}
                value={lugar.id}
              >
                {lugar.nombre}
              </option>
            ))}
          </select>

          <h3>3. Agregar equipos</h3>

          <label htmlFor="equipo-cotizacion">
            Equipo
          </label>

          <select
            id="equipo-cotizacion"
            value={equipoId}
            disabled={
              !form.fecha || cargandoInventario
            }
            onChange={e =>
              setEquipoId(e.target.value)
            }
          >
            <option value="">
              {cargandoInventario
                ? 'Cargando equipos...'
                : 'Seleccionar equipo'}
            </option>

            {inventario.map(equipo => (
              <option
                key={equipo.id}
                value={equipo.id}
                disabled={
                  equipo.disponible < 1 ||
                  equipo.precioArriendoDia == null ||
                  items.some(
                    item => item.equipoId === equipo.id
                  )
                }
              >
                {equipo.nombre}
                {' — '}
                {equipo.precioArriendoDia == null
                  ? 'Sin precio'
                  : `${pesos(equipo.precioArriendoDia)}/día`}
                {' — '}
                {equipo.disponible ?? 0} disponibles
              </option>
            ))}
          </select>

          <div className="cotizacion-campos">
            <div>
              <label htmlFor="cantidad-equipo">
                Cantidad
              </label>

              <input
                id="cantidad-equipo"
                type="number"
                min="1"
                max={
                  equipoSeleccionado?.disponible || 1000
                }
                value={cantidad}
                onChange={e =>
                  setCantidad(e.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="dias-equipo">
                Días de arriendo
              </label>

              <input
                id="dias-equipo"
                type="number"
                min="1"
                max="30"
                value={dias}
                onChange={e =>
                  setDias(e.target.value)
                }
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={agregarEquipo}
            disabled={cargandoInventario}
          >
            + Agregar a la cotización
          </button>

          <h3>4. Equipos cotizados</h3>

          {items.length === 0 ? (
            <p>
              No hay equipos agregados todavía.
            </p>
          ) : (
            <div className="cotizacion-tabla">

              <table>
                <thead>
                  <tr>
                    <th>Equipo</th>
                    <th>Cantidad</th>
                    <th>Días</th>
                    <th>Subtotal</th>
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(item => (
                    <tr key={item.equipoId}>
                      <td>{item.nombre}</td>

                      <td>{item.cantidad}</td>

                      <td>{item.diasArriendo}</td>

                      <td>
                        {pesos(
                          item.precioUnitarioDia *
                          item.cantidad *
                          item.diasArriendo
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() =>
                            eliminarItem(item.equipoId)
                          }
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}

          <h3>5. Resumen del presupuesto</h3>

          <label htmlFor="servicios-cotizacion">
            Otros servicios ($)
          </label>

          <input
            id="servicios-cotizacion"
            type="number"
            min="0"
            max="500000000"
            step="1"
            value={form.costoServicios}
            onChange={e =>
              cambiar(
                'costoServicios',
                e.target.value
              )
            }
          />

          <p>
            <strong>Subtotal equipos:</strong>{' '}
            {pesos(totalEquipos)}
          </p>

          <p>
            <strong>Otros servicios:</strong>{' '}
            {pesos(totalServicios)}
          </p>

          <div className="presupuesto-total">
            Total cotización: {pesos(total)}
          </div>

          <p className="helper-text">
            Los equipos seleccionados se incorporarán
            al presupuesto, pero no quedarán reservados
            hasta que se realice una reserva formal.
          </p>

          <div className="presupuesto-actions">

            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancelar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn"
              disabled={
                guardando ||
                guardandoCliente ||
                cargandoInventario
              }
            >
              {guardando
                ? 'Enviando cotización...'
                : 'Enviar al gerente'}
            </button>

          </div>

        </form>
      </section>
    </div>
  );
}
