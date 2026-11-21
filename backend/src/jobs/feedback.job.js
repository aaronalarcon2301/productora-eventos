
import 'dotenv/config';
import { randomBytes, createHash } from 'node:crypto';
import nodemailer from 'nodemailer';
import prisma from '../config/prisma.js';

const HORAS_ESPERA = 24;
const DIAS_VIGENCIA = 14;
const INTERVALO_MS = 5 * 60 * 1000;

let ejecutando = false;

function hashToken(token) {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

function configurarCorreo() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    FRONTEND_PUBLIC_URL
  } = process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !SMTP_FROM ||
    !FRONTEND_PUBLIC_URL
  ) {
    return null;
  }

  const puerto = Number(SMTP_PORT);

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: puerto,
    secure: puerto === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

async function enviarInvitacion(evento, invitacionAnterior, correo) {
  if (!correo || !correo.includes('@')) return;

  const transporter = configurarCorreo();

  if (!transporter) return;

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  const expiraAt = new Date(
    Date.now() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000
  );

  if (invitacionAnterior) {
    const bloqueo = await prisma.invitacionFeedback.updateMany({
      where: {
        id: invitacionAnterior.id,
        estado: 'ERROR',
        intentos: { lt: 3 }
      },
      data: {
        estado: 'ENVIANDO',
        tokenHash,
        expiraAt,
        intentos: { increment: 1 },
        ultimoError: null
      }
    });

    if (bloqueo.count !== 1) return;

  } else {
    try {
      await prisma.invitacionFeedback.create({
        data: {
          eventoId: evento.id,
          tokenHash,
          expiraAt,
          estado: 'ENVIANDO',
          intentos: 1
        }
      });
    } catch (err) {
      if (err.code === 'P2002') return;
      throw err;
    }
  }

  const enlace = new URL(
    '/opinion.html',
    process.env.FRONTEND_PUBLIC_URL
  );

  enlace.searchParams.set('token', token);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: correo,
      subject: 'NES Producciones - Cuéntanos tu experiencia',
      text: [
        '¡Hola!',
        '',
        'Gracias por confiar en NES Producciones.',
        '',
        `Queremos conocer tu experiencia en el evento "${evento.nombre}".`,
        '',
        'Puedes enviarnos tu opinión, sugerencia o reclamo',
        'utilizando este enlace:',
        '',
        enlace.toString(),
        '',
        'El enlace estará disponible durante 14 días',
        'y solo podrá utilizarse una vez.',
        '',
        'Muchas gracias,',
        'Equipo NES Producciones'
      ].join('\n')
    });

    await prisma.invitacionFeedback.updateMany({
      where: {
        eventoId: evento.id,
        tokenHash,
        estado: 'ENVIANDO'
      },
      data: {
        estado: 'ENVIADA',
        enviadoAt: new Date()
      }
    });

    console.log(
      `[Feedback] Invitación enviada para evento ${evento.id}`
    );

  } catch (err) {
    await prisma.invitacionFeedback.updateMany({
      where: {
        eventoId: evento.id,
        tokenHash,
        estado: 'ENVIANDO'
      },
      data: {
        estado: 'ERROR',
        ultimoError: String(err.message).slice(0, 255)
      }
    });

    console.error(
      `[Feedback] Error de envío del evento ${evento.id}:`,
      err.message
    );
  }
}

export async function procesarInvitacionesFeedback() {
  if (ejecutando) return;

  if (!configurarCorreo()) {
    console.warn(
      '[Feedback] Configura SMTP y FRONTEND_PUBLIC_URL para activar el envío.'
    );
    return;
  }

  ejecutando = true;

  try {
    const fechaLimite = new Date(
      Date.now() - HORAS_ESPERA * 60 * 60 * 1000
    );

    const idPrueba = Number(process.env.FEEDBACK_TEST_EVENTO_ID);

    if (!Number.isSafeInteger(idPrueba) || idPrueba < 1) {
        console.log('[Feedback] Configura el ID del evento de prueba.');
    return;
    }

    const eventos = await prisma.evento.findMany({
      where: {
        cancelado: false,
        finalizadoAt: {
          lte: fechaLimite
        },
        invitacionFeedback: {
          is: null
        }
      },
      select: {
        id: idPrueba,
        nombre: true,
        cliente: {
          select: {
            email: true
          }
        }
      },
      take: 50
    });

    for (const evento of eventos) {
      await enviarInvitacion(
        evento,
        null,
        evento.cliente?.email
      );
    }

    const fallidos = await prisma.invitacionFeedback.findMany({
      where: {
        estado: 'ERROR',
        intentos: { lt: 3 },
        eventoId: idPrueba,
        evento: {
          is: {
            cancelado: false,
            finalizadoAt: {
              lte: fechaLimite
            }
          }
        }
      },
      include: {
        evento: {
          select: {
            id: true,
            nombre: true,
            cliente: {
              select: {
                email: true
              }
            }
          }
        }
      },
      take: 20
    });

    for (const invitacion of fallidos) {
      await enviarInvitacion(
        invitacion.evento,
        invitacion,
        invitacion.evento.cliente?.email
      );
    }

  } finally {
    ejecutando = false;
  }
}

export function iniciarFeedbackProgramado() {
  console.log('[Feedback] Programador de correos iniciado.');

  const ejecutar = () => {
    procesarInvitacionesFeedback().catch(err => {
      console.error('[Feedback] Error del programador:', err);
    });
  };

  ejecutar();

  return setInterval(ejecutar, INTERVALO_MS);
}
