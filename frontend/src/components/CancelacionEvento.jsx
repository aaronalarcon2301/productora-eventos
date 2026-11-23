
import { useEffect, useState } from 'react';
import { apiFetch } from '../api/apiFetch';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatoPesos = n =>
  `$${Number(n).toLocaleString('es-CL')}`;

const formatoFecha = f =>
  new Date(f).toLocaleDateString('es-CL', {
    timeZone: 'UTC'
  });

const hoy = () =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Santiago'
  }).format(new Date());

function CancelacionEvento({ evento, onActualizado }) {
  const [fechaPago, setFechaPago] = useState(hoy());

  const [montoAbono, setMontoAbono] = useState(
    evento.presupuesto
      ? Math.round(evento.presupuesto * 0.5)
      : ''
  );

  const [fechaSolicitud, setFechaSolicitud] = useState(hoy());

  const [comprobante, setComprobante] = useState(null);
  const [simulacion, setSimulacion] = useState(null);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    setSimulacion(null);
    setComprobante(null);
    setError(null);
    setFechaSolicitud(hoy());
  }, [evento.id]);

  // ==========================================
  // REGISTRAR ABONO
  // ==========================================

  const registrarAbono = async e => {
    e.preventDefault();
    setError(null);
    setProcesando(true);

    try {
      const data = await apiFetch(
        `/eventos/${evento.id}`,
        {
          method: 'PUT',

          body: {
            confirmado: true,
            fechaPago,
            montoAbono: Number(montoAbono)
          }
        }
      );

      onActualizado({
        ...evento,
        ...data
      });

    } catch (err) {
      setError(err.message);

    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // SIMULAR DEVOLUCIÓN
  // ==========================================

  const simularDevolucion = async () => {
    setError(null);
    setSimulacion(null);
    setProcesando(true);

    try {
      const datos = await apiFetch(
        `/eventos/${evento.id}/simular-devolucion`,
        {
          method: 'POST',
          body: { fechaSolicitud }
        }
      );

      setSimulacion(datos);

    } catch (err) {
      setError(err.message);

    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // CONFIRMAR CANCELACIÓN
  // ==========================================

  const cancelarEvento = async () => {
    if (!simulacion) return;

    const aceptar = window.confirm(
      `¿Confirmas cancelar "${evento.nombre}" y registrar la devolución?\n\n` +
      `Monto estimado: ${formatoPesos(simulacion.montoDevolucion)}.\n` +
      'Esta acción no puede deshacerse desde esta pantalla.'
    );

    if (!aceptar) return;

    setError(null);
    setProcesando(true);

    try {
      const data = await apiFetch(
        `/eventos/${evento.id}/cancelar`,
        {
          method: 'POST',
          body: { fechaSolicitud }
        }
      );

      setComprobante(data.comprobante);
      setSimulacion(null);
      onActualizado(data.evento);

    } catch (err) {
      setError(err.message);
      setSimulacion(null);

    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // GENERAR PDF
  // ==========================================

  const generarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');

    doc.text(
      'COMPROBANTE DE CANCELACIÓN Y DEVOLUCIÓN',
      105,
      20,
      null,
      null,
      'center'
    );

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(
      `Fecha de emisión: ${hoy()}`,
      14,
      35
    );

    doc.text(
      `Comprobante #: ${comprobante.numeroComprobante}`,
      130,
      35
    );

    doc.line(14, 38, 196, 38);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    doc.text(
      'Información del Cliente',
      105,
      50,
      null,
      null,
      'center'
    );

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(
      `Nombre del Cliente: ${comprobante.cliente}`,
      14,
      60
    );

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    doc.text(
      'Información del Evento',
      105,
      75,
      null,
      null,
      'center'
    );

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(
      `Nombre del Evento: ${comprobante.evento}`,
      14,
      85
    );

    doc.text(
      `Ubicación del Evento: ${comprobante.lugar}`,
      14,
      95
    );

    doc.text(
      `Fecha de pago de abono: ${formatoFecha(comprobante.fechaPago)}`,
      14,
      105
    );

    doc.text(
      `Fecha solicitud cancelación: ${formatoFecha(comprobante.fechaCancelacion)}`,
      14,
      115
    );

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    doc.text(
      'Información de Pago y Devolución',
      105,
      130,
      null,
      null,
      'center'
    );

    autoTable(doc, {
      startY: 135,

      head: [
        ['Descripción', 'Detalle', 'Total']
      ],

      body: [
        [
          'Abono inicial pagado',
          '',
          formatoPesos(comprobante.montoAbono)
        ],

        [
          'Días hábiles transcurridos',
          comprobante.diasHabilesTranscurridos.toString(),
          ''
        ],

        [
          'Porcentaje de devolución',
          `${comprobante.porcentajeDevolucion}%`,
          ''
        ]
      ],

      foot: [
        [
          '',
          'Monto final a devolver:',
          formatoPesos(comprobante.montoDevolucion)
        ]
      ],

      theme: 'grid',

      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },

      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      }
    });

    doc.save(
      `Devolucion_${comprobante.numeroComprobante}.pdf`
    );
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="panel-inset">
      <h3 style={{ marginTop: 0 }}>
        Gestión de abono y cancelación
      </h3>

      {evento.cancelado && !comprobante && (
        <p>
          <span className="status cancelled">
            <span className="dot" />
            Evento cancelado
          </span>
          {' '}el{' '}
          {formatoFecha(evento.fechaCancelacion)}.
          {' '}Monto a devolver:{' '}
          <strong>
            {formatoPesos(evento.montoDevolucion ?? 0)}
          </strong>
        </p>
      )}

      {/* REGISTRO DEL ABONO */}

      {!evento.cancelado && !evento.confirmado && (
        <form onSubmit={registrarAbono}>
          <p
            className="empty"
            style={{
              padding: 0,
              marginBottom: 12
            }}
          >
            Aún no hay abono registrado.
            Al registrarlo, el evento queda confirmado
            y la fecha se bloquea.
          </p>

          <div className="field">
            <label htmlFor="fecha-pago">
              Fecha del pago
            </label>

            <input
              id="fecha-pago"
              type="date"
              value={fechaPago}
              onChange={e =>
                setFechaPago(e.target.value)
              }
            />
          </div>

          <div className="field">
            <label htmlFor="monto-abono">
              Monto del abono pagado ($)
            </label>

            <input
              id="monto-abono"
              type="number"
              value={montoAbono}
              onChange={e =>
                setMontoAbono(e.target.value)
              }
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={procesando}
          >
            {procesando
              ? 'Registrando...'
              : 'Registrar abono'}
          </button>
        </form>
      )}

      {/* SIMULACIÓN DE DEVOLUCIÓN */}

      {!evento.cancelado && evento.confirmado && (
        <div>
          <p style={{ marginBottom: 14 }}>
            Abono de{' '}
            <strong>
              {formatoPesos(evento.montoAbono)}
            </strong>
            {' '}pagado el{' '}
            {formatoFecha(evento.fechaPago)}.
          </p>

          <div className="field">
            <label htmlFor="fecha-solicitud">
              Fecha de la solicitud de cancelación
            </label>

            <input
              id="fecha-solicitud"
              type="date"
              value={fechaSolicitud}
              onChange={e => {
                setFechaSolicitud(e.target.value);
                setSimulacion(null);
                setError(null);
              }}
            />
          </div>

          <div
            className="presupuesto-actions"
            style={{ marginTop: 12 }}
          >
            <button
              type="button"
              className="btn"
              onClick={simularDevolucion}
              disabled={procesando}
            >
              {procesando
                ? 'Calculando...'
                : 'Simular devolución'}
            </button>
          </div>

          {/* RESULTADO SIN CANCELAR */}

          {simulacion && (
            <div
              className="panel-inset"
              style={{ marginTop: 14 }}
            >
              <h4>Resultado de la simulación</h4>

              <p>
                Días hábiles transcurridos:{' '}
                <strong>
                  {simulacion.diasHabilesTranscurridos}
                </strong>
              </p>

              <p>
                Porcentaje de devolución:{' '}
                <strong>
                  {simulacion.porcentajeDevolucion}%
                </strong>
              </p>

              <p>
                Abono pagado:{' '}
                <strong>
                  {formatoPesos(simulacion.montoAbono)}
                </strong>
              </p>

              <p>
                Monto estimado a devolver:{' '}
                <strong>
                  {formatoPesos(simulacion.montoDevolucion)}
                </strong>
              </p>

              <p className="helper-text">
                Esta es una estimación.
                El backend verificará nuevamente
                el cálculo antes de cancelar.
              </p>

              <button
                type="button"
                onClick={cancelarEvento}
                className="btn btn-danger"
                disabled={procesando}
              >
                Confirmar cancelación
              </button>
            </div>
          )}
        </div>
      )}

      {/* MENSAJES DE ERROR */}

      {error && (
        <p
          className="alert alert-error"
          style={{ marginTop: 14 }}
        >
          {error}
        </p>
      )}

      {/* COMPROBANTE */}

      {comprobante && (
        <div
          className="panel receipt"
          style={{
            marginTop: 16,
            marginBottom: 0
          }}
          id="comprobante"
        >
          <h3 style={{ marginTop: 0 }}>
            Comprobante de devolución N.º{' '}
            {comprobante.numeroComprobante}
          </h3>

          <dl>
            <dt>Evento</dt>
            <dd>{comprobante.evento}</dd>

            <dt>Cliente</dt>
            <dd>{comprobante.cliente}</dd>

            <dt>Lugar</dt>
            <dd>{comprobante.lugar}</dd>

            <dt>Fecha del pago</dt>
            <dd>{formatoFecha(comprobante.fechaPago)}</dd>

            <dt>Fecha de la solicitud</dt>
            <dd>{formatoFecha(comprobante.fechaCancelacion)}</dd>

            <dt>Días hábiles transcurridos</dt>
            <dd>{comprobante.diasHabilesTranscurridos}</dd>

            <dt>Porcentaje de devolución</dt>
            <dd>{comprobante.porcentajeDevolucion}%</dd>

            <dt>Abono pagado</dt>
            <dd>{formatoPesos(comprobante.montoAbono)}</dd>
          </dl>

          <div className="total">
            <span>Monto a devolver</span>
            <span>
              {formatoPesos(comprobante.montoDevolucion)}
            </span>
          </div>

          <button
            type="button"
            onClick={generarPDF}
            className="btn btn-ghost"
            style={{ marginTop: 16 }}
          >
            Imprimir comprobante
          </button>
        </div>
      )}
    </div>
  );
}

export default CancelacionEvento;
