
import nodemailer from "nodemailer";
import prisma from "../config/prisma.js";
import { httpError } from "../utils/http.js";
import { eventoFinalizado } from "../utils/fechas.js";

// Por seguridad, el envío está desactivado
// hasta habilitarlo desde backend/.env.
const habilitado = () =>
  process.env.TURNOS_EMAIL_ACTIVO === "true";

function prepararTransportador() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM
  } = process.env;

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
    throw new Error(
      "Falta configurar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS o SMTP_FROM."
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: puerto,
    secure: puerto === 465,

    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

function fechaEvento(fecha) {
  const d = new Date(fecha);

  const dia = String(
    d.getUTCDate()
  ).padStart(2, "0");

  const mes = String(
    d.getUTCMonth() + 1
  ).padStart(2, "0");

  const anio = d.getUTCFullYear();

  return `${dia}-${mes}-${anio}`;
}


export async function enviarNotificacionTurno(
  asignacionId
) {
  const asignacion =
    await prisma.asignacionTrabajador.findUnique({
      where: {
        id: asignacionId
      },

      include: {
        trabajador: {
          select: {
            nombre: true,
            email: true
          }
        },

        evento: {
          include: {
            lugar: true
          }
        }
      }
    });

  if (!asignacion) {
    throw httpError(
      404,
      "La asignación no existe."
    );
  }

  if (!asignacion.turno || !asignacion.horaLlegada) {
    throw httpError(
      409,
      "La asignación no tiene turno y hora de llegada definidos."
    );
  }

  if (
    asignacion.evento.cancelado ||
    eventoFinalizado(asignacion.evento)
  ) {
    throw httpError(
      409,
      "No se puede notificar un evento cancelado o finalizado."
    );
  }

  if (asignacion.notificacionEstado === "ENVIADA") {
    throw httpError(
      409,
      "El correo ya fue enviado a este trabajador."
    );
  }

  if (!habilitado()) {
    return {
      estado: asignacion.notificacionEstado,
      mensaje:
        "Correo pendiente. Activa TURNOS_EMAIL_ACTIVO=true para enviarlo."
    };
  }

  const bloqueo =
    await prisma.asignacionTrabajador.updateMany({
      where: {
        id: asignacionId,

        notificacionEstado: {
          in: ["PENDIENTE", "ERROR"]
        }
      },

      data: {
        notificacionEstado: "ENVIANDO",
        notificacionError: null
      }
    });

  if (bloqueo.count !== 1) {
    throw httpError(
      409,
      "La notificación ya está en proceso o fue enviada."
    );
  }

  try {
    const correo = asignacion.trabajador.email?.trim();

    if (
      !correo ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      throw new Error(
        "El trabajador debe tener un correo electrónico válido."
      );
    }

    const transporte = prepararTransportador();

    const lugar = asignacion.evento.lugar;

    const nombreTurno =
      asignacion.turno === "DIURNO"
        ? "Diurno"
        : "Nocturno";

    await transporte.sendMail({
      from: process.env.SMTP_FROM,
      to: correo,

      subject:
        `NES Producciones - Turno asignado: ${asignacion.evento.nombre}`,

      text: [
        `Hola ${asignacion.trabajador.nombre}:`,
        "",
        "Te informamos de tu asignación a un evento de NES Producciones.",
        "",
        `Evento: ${asignacion.evento.nombre}`,
        `Fecha: ${fechaEvento(asignacion.evento.fecha)}`,
        `Turno: ${nombreTurno}`,
        `Hora de llegada: ${asignacion.horaLlegada} (hora de Chile)`,
        `Lugar: ${lugar.nombre}`,
        `Dirección: ${
          lugar.ubicacion ||
          "Por confirmar con la productora"
        }`,
        `Rol asignado: ${asignacion.rol.replaceAll("_", " ")}`,
        "",
        "Por favor, coordina cualquier duda directamente con NES Producciones.",
        "Saludos,",
        "NES Producciones"
      ].join("\n")
    });

  } catch (error) {
    const mensaje = String(
      error.message || "Error al enviar correo"
    ).slice(0, 255);

    await prisma.asignacionTrabajador.updateMany({
      where: {
        id: asignacionId,
        notificacionEstado: "ENVIANDO"
      },

      data: {
        notificacionEstado: "ERROR",
        notificacionError: mensaje
      }
    });

    console.error(
      `[Turnos] Error en asignación ${asignacionId}: ${mensaje}`
    );

    return {
      estado: "ERROR",
      mensaje:
        "La asignación se guardó, pero el correo no se pudo enviar. Revisa la configuración SMTP o el correo del trabajador."
    };
  }

  await prisma.asignacionTrabajador.updateMany({
    where: {
      id: asignacionId,
      notificacionEstado: "ENVIANDO"
    },

    data: {
      notificacionEstado: "ENVIADA",
      notificacionEnviadaAt: new Date(),
      notificacionError: null
    }
  });

  return {
    estado: "ENVIADA",
    mensaje: "El servidor SMTP aceptó el correo del turno."
  };
}
