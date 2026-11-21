import prisma from "../config/prisma.js";
import { httpError } from "../utils/http.js";
import { hashPassword } from "../utils/password.js";

async function cargarTrabajador(trabajadorId) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: trabajadorId },
    include: { usuario: true },
  });
  if (!trabajador) throw httpError(404, "Trabajador no encontrado.");
  return trabajador;
}

function estadoAcceso(trabajador) {
  const usuario = trabajador.usuario;
  return {
    tieneAcceso: Boolean(usuario),
    activo: usuario ? usuario.activo : false,
    email: usuario ? usuario.email : trabajador.email ?? null,
  };
}

export async function obtenerAcceso(trabajadorId) {
  return estadoAcceso(await cargarTrabajador(trabajadorId));
}

export async function guardarAcceso(trabajadorId, password) {
  const trabajador = await cargarTrabajador(trabajadorId);

  if (!trabajador.email) {
    throw httpError(409, "El trabajador no tiene correo. Agrégalo en su ficha para poder darle acceso.");
  }

  const email = trabajador.email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      if (trabajador.usuario) {
        await tx.usuario.update({
          where: { id: trabajador.usuario.id },
          data: { email, nombre: trabajador.nombre, passwordHash, activo: true },
        });
        await tx.sesion.deleteMany({ where: { usuarioId: trabajador.usuario.id } });
      } else {
        const usuario = await tx.usuario.create({
          data: { nombre: trabajador.nombre, email, rol: "PERSONAL", passwordHash },
        });
        await tx.trabajador.update({ where: { id: trabajador.id }, data: { usuarioId: usuario.id } });
      }
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw httpError(409, "Ese correo ya lo usa otra cuenta del sistema.");
    }
    throw err;
  }

  return obtenerAcceso(trabajadorId);
}

export async function desactivarAcceso(trabajadorId) {
  const trabajador = await cargarTrabajador(trabajadorId);
  if (!trabajador.usuario) throw httpError(404, "Este trabajador no tiene acceso al sistema.");

  await prisma.$transaction([
    prisma.usuario.update({ where: { id: trabajador.usuario.id }, data: { activo: false } }),
    prisma.sesion.deleteMany({ where: { usuarioId: trabajador.usuario.id } }),
  ]);

  return obtenerAcceso(trabajadorId);
}
