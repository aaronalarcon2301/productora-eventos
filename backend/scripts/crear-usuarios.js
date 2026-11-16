import 'dotenv/config';

import prisma from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';

const usuarios = [
  {
    rol: 'GERENTE',
    nombre: 'Gerente NES',
    prefijo: 'GERENTE'
  },
  {
    rol: 'TRABAJADOR',
    nombre: 'Trabajador NES',
    prefijo: 'TRABAJADOR'
  }
];

try {
  for (const usuario of usuarios) {
    const email = String(
      process.env[`${usuario.prefijo}_EMAIL`] || ''
    ).trim().toLowerCase();

    const password = process.env[
      `${usuario.prefijo}_PASSWORD`
    ];

    if (!email || !password) {
      throw new Error(
        `Configura ${usuario.prefijo}_EMAIL y ${usuario.prefijo}_PASSWORD`
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error('Correo inválido');
    }

    const passwordHash = await hashPassword(password);

    await prisma.usuario.upsert({
      where: { email },
      update: {
        nombre: usuario.nombre,
        rol: usuario.rol,
        passwordHash,
        activo: true
      },
      create: {
        nombre: usuario.nombre,
        email,
        rol: usuario.rol,
        passwordHash
      }
    });

    console.log(`Usuario ${usuario.rol} configurado: ${email}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}