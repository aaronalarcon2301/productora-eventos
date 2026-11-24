import nodemailer from "nodemailer";

// Usa el mismo interruptor y la misma configuración SMTP que los avisos de turno.
const habilitado = () => process.env.TURNOS_EMAIL_ACTIVO === "true";

function prepararTransportador() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const puerto = Number(SMTP_PORT);

  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !SMTP_FROM ||
    !Number.isInteger(puerto) ||
    puerto < 1 ||
    puerto > 65535
  ) {
    throw new Error("Falta configurar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS o SMTP_FROM.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: puerto,
    secure: puerto === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

export function armarCorreoAcceso({ nombre, email, password, esNuevo }) {
  const direccion = process.env.APP_URL?.trim();

  const lineas = [
    `Hola ${nombre}:`,
    "",
    esNuevo
      ? "Te damos la bienvenida a NES Producciones. Se creó tu cuenta en nuestro sistema de gestión y quedaste registrado/a como trabajador/a eventual."
      : "Tu acceso al sistema de gestión de NES Producciones fue actualizado y tiene una nueva clave.",
    "",
    "Con tu cuenta puedes:",
    "- Ver los eventos en que te asignamos, con la fecha, el turno, la hora de llegada y el lugar.",
    "- Confirmar tu asistencia o avisar que no podrás asistir.",
    "- Revisar tus evaluaciones y tus datos de contacto.",
    "- Actualizar tu teléfono, comuna y disponibilidad.",
    "",
    "Tus datos de acceso:",
    ...(direccion ? [`Dirección: ${direccion}`] : []),
    `Correo: ${email}`,
    `Contraseña: ${password}`,
    "",
    "Recomendaciones:",
    "- Guarda esta contraseña en un lugar seguro y no la compartas con nadie.",
    "- Puedes cambiarla cuando quieras desde la sección \"Mis datos\", después de ingresar.",
    "",
    "Si no esperabas este correo o tienes problemas para ingresar, responde a este mensaje o comunícate con NES Producciones.",
    "",
    "Saludos,",
    "NES Producciones",
  ];

  return {
    subject: esNuevo
      ? "NES Producciones - Tu cuenta fue creada"
      : "NES Producciones - Tu acceso fue actualizado",
    text: lineas.join("\n"),
  };
}

// Nunca lanza error: si el correo falla, el acceso ya quedó guardado.
export async function enviarCorreoAcceso({ nombre, email, password, esNuevo }) {
  if (!habilitado()) {
    return {
      estado: "PENDIENTE",
      mensaje: "El envío de correos está desactivado (TURNOS_EMAIL_ACTIVO). Entrégale la clave al trabajador.",
    };
  }

  try {
    const transporte = prepararTransportador();
    const { subject, text } = armarCorreoAcceso({ nombre, email, password, esNuevo });
    await transporte.sendMail({ from: process.env.SMTP_FROM, to: email, subject, text });
    return { estado: "ENVIADO", mensaje: `Se envió un correo a ${email} con sus datos de acceso.` };
  } catch (error) {
    console.error(`[Acceso] No se pudo enviar el correo a ${email}: ${String(error.message).slice(0, 200)}`);
    return {
      estado: "ERROR",
      mensaje: "El acceso se guardó, pero el correo no se pudo enviar. Entrégale la clave al trabajador.",
    };
  }
}
