/* 
Script de seed para la bd - utiliza Faker para generar datos falsos pero realistas, incluyendo clientes, lugares, 
eventos y reclamos de una productora de eventos.

=> Faker es una librería que genera datos falsos con apariencia real (nombres, emails, direcciones, fechas, etc.). 
Es perfecta para poblar tu base de datos en desarrollo y tener contenido visualmente atractivo para el frontend 
sin tener que crear datos manualmente uno por uno.
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando datos anteriores...');
  await prisma.reclamo.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.lugar.deleteMany();

  console.log('=> Creando clientes...');
  const clientes = await Promise.all(
    Array.from({ length: 6 }).map(() =>
      prisma.cliente.create({
        data: {
          nombre: faker.person.fullName(),
          email: faker.internet.email(),
          telefono: faker.phone.number(),
        },
      })
    )
  );

  console.log('=> Creando lugares...');
  const nombresLugares = ['Salón Las Condes', 'Quinta Vergara', 'Terraza Bellavista', 'Centro de Eventos Andes'];
  const lugares = await Promise.all(
    nombresLugares.map((nombre) =>
      prisma.lugar.create({
        data: {
          nombre,
          ubicacion: faker.location.city(),
          capacidad: faker.number.int({ min: 50, max: 500 }),
        },
      })
    )
  );

  console.log('=> Creando eventos...');
  const nombresEventos = [
    'Matrimonio Pérez-Soto', 'Cumpleaños 50 años Andrea', 'Concierto banda local',
    'Charla de innovación tecnológica', 'Aniversario empresa ConstruSur', 'Bautizo familia Rivas',
    'Lanzamiento de producto Nutrisana', 'Graduación colegio San Martín',
  ];

  const eventos = await Promise.all(
    nombresEventos.map((nombre) =>
      prisma.evento.create({
        data: {
          nombre,
          fecha: faker.date.soon({ days: 180 }),
          numInvitados: faker.number.int({ min: 20, max: 300 }),
          presupuesto: faker.number.float({ min: 300000, max: 8000000, fractionDigits: 0 }),
          confirmado: faker.datatype.boolean(),
          clienteId: faker.helpers.arrayElement(clientes).id,
          lugarId: faker.helpers.arrayElement(lugares).id,
        },
      })
    )
  );

  console.log('=> Creando reclamos...');
  for (const evento of eventos) {
    const cantidadReclamos = faker.number.int({ min: 0, max: 4 });
    for (let i = 0; i < cantidadReclamos; i++) {
      await prisma.reclamo.create({
        data: {
          autor: faker.person.fullName(),
          calificacion: faker.number.int({ min: 1, max: 5 }),
          mensaje: faker.lorem.sentences(2),
          eventoId: evento.id,
        },
      });
    }
  }

  console.log('--- Seed completado :V ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
