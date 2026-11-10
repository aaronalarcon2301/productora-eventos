import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import prismaApp from '../src/config/prisma.js'; // cliente que usan los servicios de la app
import { calcularDv } from '../src/utils/rut.js';
import { asignarTrabajador } from '../src/services/asignacion.service.js';
import { crearEvaluacion, actualizarEvaluacion } from '../src/services/evaluacion.service.js';
import { crearIncidente } from '../src/services/incidente.service.js';
import { registrarEntrega, registrarDevolucion, crearReserva } from '../src/services/reservaEquipo.service.js';
import {
  crearEvaluacionSchema,
  editarEvaluacionSchema,
  SUBINDICADORES_BASE,
  SUBINDICADORES_TECNICOS,
  esRolTecnico,
} from '../src/schemas/evaluacion.schema.js';


const ROLES = [
  'ADMINISTRADOR', 'COORDINADOR', 'TECNICO_SONIDO', 'TECNICO_ILUMINACION', 'MONTAJISTA'];



const prisma = new PrismaClient();

// =====================================================================
// DATOS DE DEMOSTRACIÓN DEL MÓDULO DE PERSONAL
// (trabajadores, asignaciones, evaluaciones, incidentes y bitácora)
//
// Se crean al final de este seed, reutilizando los clientes y lugares que acaba de crear arriba.
// Son repetibles: antes de crearlos se borran SOLO los trabajadores de demo de Personal
// (los trabajadores con correo @demo.nes.cl; los eventos ya los borra el seed de arriba).
// Usan los mismos servicios que la aplicación, así que cumplen todas las reglas de negocio.
// =====================================================================
const DOMINIO_DEMO = '@demo.nes.cl';
const DIA_MS = 24 * 60 * 60 * 1000;

const conDv = (cuerpo) => `${cuerpo}-${calcularDv(String(cuerpo))}`;

// perfil: excelente | regular | bajo (define qué notas recibe en las evaluaciones)
const TRABAJADORES_DEMO = [
  { clave: 'camila', nombre: 'Camila Rojas Pizarro', rut: 98000001, rol: 'GARZON', comuna: 'Concepción', anios: 4, dias: ['VIERNES', 'SABADO', 'DOMINGO'], turno: 'AMBOS', talla: 'S', banco: 'BancoEstado', tipoCuenta: 'CUENTA_RUT', cuenta: '98000001', telefono: '+56981234501', perfil: 'excelente' },
  { clave: 'matias', nombre: 'Matías Fuentes Lagos', rut: 98000002, rol: 'TECNICO_SONIDO', comuna: 'Talcahuano', anios: 8, dias: ['JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'], turno: 'NOCTURNO', talla: 'L', banco: 'Banco de Chile', tipoCuenta: 'CORRIENTE', cuenta: '123456789', telefono: '+56981234502', perfil: 'excelente' },
  { clave: 'javiera', nombre: 'Javiera Soto Cárdenas', rut: 98000003, rol: 'ANFITRION', comuna: 'San Pedro de la Paz', anios: 2, dias: ['SABADO', 'DOMINGO'], turno: 'DIURNO', talla: 'M', banco: 'BCI', tipoCuenta: 'VISTA', cuenta: '55667788', telefono: '+56981234503', perfil: 'regular' },
  { clave: 'felipe', nombre: 'Felipe Araya Mella', rut: 98000004, rol: 'TECNICO_ILUMINACION', comuna: 'Concepción', anios: 6, dias: ['VIERNES', 'SABADO'], turno: 'NOCTURNO', talla: 'XL', banco: 'Banco Santander', tipoCuenta: 'CORRIENTE', cuenta: '778899001', telefono: '+56981234504', perfil: 'regular' },
  { clave: 'diego', nombre: 'Diego Pardo Salazar', rut: 98000005, rol: 'MONTAJISTA', comuna: 'Chiguayante', anios: 1, dias: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'], turno: 'DIURNO', talla: 'L', banco: null, tipoCuenta: null, cuenta: null, telefono: '+56981234505', perfil: 'bajo' },
  { clave: 'valentina', nombre: 'Valentina Mora Henríquez', rut: 98000006, rol: 'ANIMADOR', comuna: 'Hualpén', anios: 5, dias: ['VIERNES', 'SABADO', 'DOMINGO'], turno: 'AMBOS', talla: 'M', banco: 'Scotiabank', tipoCuenta: 'AHORRO', cuenta: '40506070', telefono: '+56981234506', perfil: 'excelente' },
  { clave: 'sebastian', nombre: 'Sebastián Vera Contreras', rut: 98000007, rol: 'SEGURIDAD', comuna: 'Coronel', anios: 3, dias: ['SABADO', 'DOMINGO'], turno: 'NOCTURNO', talla: 'XL', banco: 'BancoEstado', tipoCuenta: 'VISTA', cuenta: '66778899', telefono: '+56981234507', perfil: 'regular' },
  { clave: 'constanza', nombre: 'Constanza Díaz Ortiz', rut: 98000008, rol: 'ASEO_LOGISTICA', comuna: 'Concepción', anios: 2, dias: ['LUNES', 'MARTES', 'MIERCOLES'], turno: 'DIURNO', talla: 'S', banco: 'Banco Falabella', tipoCuenta: 'VISTA', cuenta: '30405060', telefono: '+56981234508', perfil: 'regular' },
  // Sin historial: sirve para probar que un trabajador sin eventos se puede eliminar de verdad.
  { clave: 'nicolas', nombre: 'Nicolás Peña Valdés', rut: 98000009, rol: 'GARZON', comuna: 'Lota', anios: 0, dias: ['SABADO'], turno: 'DIURNO', talla: 'M', banco: null, tipoCuenta: null, cuenta: null, telefono: '+56981234509', perfil: 'regular' },
];

// dias: desfase respecto a hoy (negativo = ya ocurrió, positivo = aún no ocurre)
const EVENTOS_DEMO = [
  { clave: 'boda', nombre: 'Matrimonio Alvarado-Reyes', dias: -30, invitados: 180, presupuesto: 4200000 },
  { clave: 'gala', nombre: 'Gala de aniversario Constructora Sur', dias: -20, invitados: 250, presupuesto: 6800000 },
  { clave: 'corporativo', nombre: 'Lanzamiento de producto Vitalcorp', dias: -10, invitados: 120, presupuesto: 3100000 },
  { clave: 'proximo', nombre: 'Cumpleaños 40 años Rodrigo', dias: 15, invitados: 90, presupuesto: 1900000 },
];

// Quién trabaja en cada evento (cada uno con su cargo principal). El evento 'proximo' aún no ocurre.
const PLAN_DEMO = [
  { evento: 'boda', equipo: ['camila', 'matias', 'javiera', 'diego', 'sebastian'] },
  { evento: 'gala', equipo: ['camila', 'matias', 'felipe', 'valentina', 'constanza'] },
  { evento: 'corporativo', equipo: ['camila', 'javiera', 'diego', 'valentina', 'sebastian'] },
  { evento: 'proximo', equipo: ['camila', 'matias', 'felipe'] },
];

const NOTA_BASE = { excelente: 4, regular: 3, bajo: 2 };
const COMENTARIOS_NOTA = {
  5: 'Desempeño sobresaliente, superó lo esperado.',
  2: 'Estuvo por debajo de lo esperado en este punto.',
  1: 'Incumplió lo acordado en este punto.',
};

function mediodiaUTC(desfaseDias) {
  const d = new Date(Date.now() + desfaseDias * DIA_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12));
}

// Arma una evaluación válida (con comentarios en las notas 1, 2 y 5) y la valida con el mismo schema de la API.
function armarEvaluacion(trabajadorId, eventoId, rol, perfil, variante) {
  const datos = { trabajadorId, eventoId, rolEvento: rol };
  const criterios = esRolTecnico(rol) ? [...SUBINDICADORES_BASE, ...SUBINDICADORES_TECNICOS] : SUBINDICADORES_BASE;

  criterios.forEach(([campo, campoComentario], i) => {
    let nota = NOTA_BASE[perfil] + ((i + variante) % 3 === 0 ? 1 : 0);
    if (perfil === 'bajo' && i === 0) nota = 1; // llegó muy tarde
    datos[campo] = nota;
    if (COMENTARIOS_NOTA[nota]) datos[campoComentario] = COMENTARIOS_NOTA[nota];
  });
  return crearEvaluacionSchema.parse(datos);
}

async function limpiarDatosDemoPersonal() {
  const trabajadores = await prisma.trabajador.findMany({ where: { email: { endsWith: DOMINIO_DEMO } }, select: { id: true } });
  const idsTrabajadores = trabajadores.map((t) => t.id);

  // Orden importante: primero lo que depende de trabajadores y eventos.
  await prisma.auditoriaEvaluacion.deleteMany({ where: { trabajadorId: { in: idsTrabajadores } } });
  await prisma.incidente.deleteMany({ where: { trabajadorId: { in: idsTrabajadores } } });
  await prisma.evaluacion.deleteMany({ where: { trabajadorId: { in: idsTrabajadores } } });
  await prisma.asignacionTrabajador.deleteMany({ where: { trabajadorId: { in: idsTrabajadores } } });
  await prisma.trabajador.deleteMany({ where: { id: { in: idsTrabajadores } } });
}

async function seedPersonal(clienteId, lugarId) {
  console.log('=> [Personal] Limpiando datos de demo anteriores...');
  await limpiarDatosDemoPersonal();

  console.log('=> [Personal] Creando trabajadores...');
  const trabajadores = {};
  for (const t of TRABAJADORES_DEMO) {
    trabajadores[t.clave] = await prisma.trabajador.create({
      data: {
        nombre: t.nombre,
        rut: conDv(t.rut),
        email: `${t.clave}${DOMINIO_DEMO}`,
        telefono: t.telefono,
        comuna: t.comuna,
        rolPrincipal: t.rol,
        aniosExperiencia: t.anios,
        disponibilidadDias: t.dias,
        disponibilidadTurno: t.turno,
        tallaUniforme: t.talla,
        banco: t.banco,
        tipoCuenta: t.tipoCuenta,
        numeroCuenta: t.cuenta,
      },
    });
  }

  console.log('=> [Personal] Creando eventos de demo...');
  const eventosDemo = {};
  for (const e of EVENTOS_DEMO) {
    eventosDemo[e.clave] = await prisma.evento.create({
      data: {
        nombre: e.nombre,
        fecha: mediodiaUTC(e.dias),
        numInvitados: e.invitados,
        presupuesto: e.presupuesto,
        confirmado: true,
        clienteId,
        lugarId,
      },
    });
  }

  console.log('=> [Personal] Asignando personal y evaluando los eventos que ya ocurrieron...');
  const evaluaciones = {};
  let totalAsignaciones = 0;
  let totalEvaluaciones = 0;

  for (const [indice, { evento, equipo }] of PLAN_DEMO.entries()) {
    const yaOcurrio = EVENTOS_DEMO.find((e) => e.clave === evento).dias < 0;

    for (const clave of equipo) {
      const trabajador = trabajadores[clave];
      const perfil = TRABAJADORES_DEMO.find((t) => t.clave === clave).perfil;

      await asignarTrabajador({ trabajadorId: trabajador.id, eventoId: eventosDemo[evento].id });
      totalAsignaciones++;

      if (yaOcurrio) {
        const datos = armarEvaluacion(trabajador.id, eventosDemo[evento].id, trabajador.rolPrincipal, perfil, indice);
        evaluaciones[`${clave}:${evento}`] = await crearEvaluacion(datos);
        totalEvaluaciones++;
      }
    }
  }

  console.log('=> [Personal] Registrando una corrección de evaluación (queda en la bitácora)...');
  const original = armarEvaluacion(trabajadores.diego.id, eventosDemo.boda.id, trabajadores.diego.rolPrincipal, 'bajo', 0);
  const corregida = { ...original, llegada: 3, motivo: 'Corrección tras revisar el reporte del encargado del evento.' };
  delete corregida.comentarioLlegada;
  await actualizarEvaluacion(evaluaciones['diego:boda'].id, editarEvaluacionSchema.parse(corregida));

  console.log('=> [Personal] Registrando incidentes...');
  await crearIncidente({
    trabajadorId: trabajadores.javiera.id,
    eventoId: eventosDemo.gala.id,
    tipo: 'INASISTENCIA',
    motivo: 'Avisó el mismo día que no podía asistir.',
  });
  await crearIncidente({
    trabajadorId: trabajadores.sebastian.id,
    eventoId: eventosDemo.corporativo.id,
    tipo: 'FALTA_GRAVE',
    motivo: 'Abandonó su puesto durante el evento sin avisar al encargado.',
  }); // bloquea al trabajador de inmediato

  console.log('=> [Personal] Dando de baja a un trabajador (queda inactivo y conserva su historial)...');
  await prisma.trabajador.update({ where: { id: trabajadores.constanza.id }, data: { activo: false } });

  const resultado = await prisma.trabajador.findMany({ where: { email: { endsWith: DOMINIO_DEMO } }, orderBy: { nombre: 'asc' } });
  console.log(`\n=> [Personal] Trabajadores: ${resultado.length} | Eventos de demo: ${EVENTOS_DEMO.length} | Asignaciones: ${totalAsignaciones} | Evaluaciones: ${totalEvaluaciones}`);
  for (const t of resultado) {
    const estado = t.bloqueado ? 'BLOQUEADO' : t.activo ? 'activo' : 'inactivo';
    const promedio = t.promedioGeneral != null ? t.promedioGeneral.toFixed(2) : 'sin evaluaciones';
    console.log(`   ${t.nombre.padEnd(28)} ${t.rolPrincipal.padEnd(20)} ${estado.padEnd(10)} promedio: ${promedio}`);
  }

  return { trabajadores, eventosDemo };
}

// =====================================================================
// DATOS DE DEMOSTRACIÓN DEL MÓDULO DE EQUIPOS
// (inventario, reservas por evento, entregas y devoluciones con daños)
//
// Usa los trabajadores y eventos de demo de Personal. Los equipos de demo se reconocen por su nombre:
// al repetir el seed se borran y se vuelven a crear (sus reservas ya se borraron junto con los eventos).
// =====================================================================
const EQUIPOS_DEMO = [
  { clave: 'parlante', nombre: 'Parlante activo 15"', categoria: 'SONIDO', total: 12, precio: 25000, descripcion: 'Con trípode y cable XLR' },
  { clave: 'consola', nombre: 'Consola mezcladora 16 canales', categoria: 'SONIDO', total: 2, precio: 60000 },
  { clave: 'cabezal', nombre: 'Cabezal móvil LED', categoria: 'ILUMINACION', total: 16, precio: 18000 },
  { clave: 'pantalla', nombre: 'Pantalla LED 3×2 m', categoria: 'AUDIOVISUAL', total: 2, mantencion: 1, precio: 150000, descripcion: 'Una unidad en reparación' },
  { clave: 'mesa', nombre: 'Mesa redonda 10 personas', categoria: 'MOBILIARIO', total: 40, precio: 6000 },
  { clave: 'silla', nombre: 'Silla Tiffany blanca', categoria: 'MOBILIARIO', total: 300, precio: 1500 },
  { clave: 'carpa', nombre: 'Carpa 6×6 m', categoria: 'ESTRUCTURA', total: 5, precio: 80000 },
];

// Eventos que ya ocurrieron: se reservan directo en la base (el sistema no deja reservar eventos finalizados),
// y luego se registran la entrega y la devolución con los servicios reales, que ajustan el stock.
const USO_PASADO_DEMO = [
  {
    evento: 'boda',
    items: [
      { equipo: 'parlante', cantidad: 8, responsable: 'matias', devolucion: { cantidadDanada: 1, observacion: '1 parlante con el cono roto.' } },
      { equipo: 'consola', cantidad: 1, responsable: 'matias', devolucion: {} },
      { equipo: 'mesa', cantidad: 18, devolucion: {} },
      { equipo: 'silla', cantidad: 180, devolucion: { cantidadFaltante: 4, observacion: 'Faltaron 4 sillas al contar.' } },
    ],
  },
  {
    evento: 'gala',
    items: [
      { equipo: 'parlante', cantidad: 6, responsable: 'matias', devolucion: {} },
      { equipo: 'cabezal', cantidad: 12, responsable: 'felipe', devolucion: {} },
      { equipo: 'carpa', cantidad: 2, devolucion: {} },
    ],
  },
  {
    evento: 'corporativo',
    items: [
      { equipo: 'pantalla', cantidad: 1, devolucion: {} },
      { equipo: 'consola', cantidad: 1, devolucion: null }, // entregada y todavía sin devolver
    ],
  },
];

// Evento futuro: se reserva con el servicio real (valida stock, fechas y responsable).
const USO_FUTURO_DEMO = [
  { evento: 'proximo', equipo: 'parlante', cantidad: 10, responsable: 'matias' },
  { evento: 'proximo', equipo: 'cabezal', cantidad: 8, responsable: 'felipe' },
  { evento: 'proximo', equipo: 'mesa', cantidad: 10 },
  { evento: 'proximo', equipo: 'carpa', cantidad: 3 },
];

async function seedEquipos({ trabajadores, eventosDemo }) {
  console.log('=> [Equipos] Limpiando equipos de demo anteriores...');
  await prisma.equipo.deleteMany({ where: { nombre: { in: EQUIPOS_DEMO.map((e) => e.nombre) } } });

  console.log('=> [Equipos] Creando inventario...');
  const equipos = {};
  for (const e of EQUIPOS_DEMO) {
    equipos[e.clave] = await prisma.equipo.create({
      data: {
        nombre: e.nombre,
        categoria: e.categoria,
        descripcion: e.descripcion ?? null,
        cantidadTotal: e.total,
        cantidadMantencion: e.mantencion ?? 0,
        precioArriendoDia: e.precio,
      },
    });
  }

  console.log('=> [Equipos] Registrando el uso de los eventos que ya ocurrieron...');
  let totalReservas = 0;
  for (const { evento, items } of USO_PASADO_DEMO) {
    for (const item of items) {
      const reserva = await prisma.reservaEquipo.create({
        data: {
          equipoId: equipos[item.equipo].id,
          eventoId: eventosDemo[evento].id,
          cantidad: item.cantidad,
          responsableId: item.responsable ? trabajadores[item.responsable].id : null,
        },
      });
      await registrarEntrega(reserva.id);
      if (item.devolucion) await registrarDevolucion(reserva.id, item.devolucion);
      totalReservas++;
    }
  }

  console.log('=> [Equipos] Reservando equipos para el próximo evento...');
  for (const r of USO_FUTURO_DEMO) {
    await crearReserva({
      equipoId: equipos[r.equipo].id,
      eventoId: eventosDemo[r.evento].id,
      cantidad: r.cantidad,
      responsableId: r.responsable ? trabajadores[r.responsable].id : null,
    });
    totalReservas++;
  }

  const resultado = await prisma.equipo.findMany({ where: { nombre: { in: EQUIPOS_DEMO.map((e) => e.nombre) } }, orderBy: { nombre: 'asc' } });
  console.log(`\n=> [Equipos] Equipos: ${resultado.length} | Reservas: ${totalReservas}`);
  for (const e of resultado) {
    console.log(`   ${e.nombre.padEnd(32)} total: ${String(e.cantidadTotal).padStart(3)}  en mantención: ${e.cantidadMantencion}`);
  }
}
// =====================================================================
// =====================================================================

async function main() {
  console.log('Limpiando datos anteriores...');
  await prisma.politicaDevolucion.deleteMany(); // <-- NUEVO: limpia las políticas
  await prisma.reclamo.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.lugar.deleteMany();

  console.log('=> Creando políticas de devolución...'); // <-- NUEVO: inserta los tramos
  await prisma.politicaDevolucion.createMany({
    data: [
      { diasDesde: 0, diasHasta: 5, porcentaje: 100 },
      { diasDesde: 6, diasHasta: 15, porcentaje: 50 },
      { diasDesde: 16, diasHasta: null, porcentaje: 0 }
    ]
  });

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
    nombresEventos.map((nombre) => {
      const presupuesto = faker.number.float({ min: 300000, max: 8000000, fractionDigits: 0 });
      const confirmado = faker.datatype.boolean();

      return prisma.evento.create({
        data: {
          nombre,
          fecha: faker.date.soon({ days: 180 }),
          numInvitados: faker.number.int({ min: 20, max: 300 }),
          presupuesto,
          confirmado,
          fechaPago: confirmado ? faker.date.recent({ days: 30 }) : undefined,
          montoAbono: confirmado ? Math.round(presupuesto * 0.5) : undefined,
          clienteId: faker.helpers.arrayElement(clientes).id,
          lugarId: faker.helpers.arrayElement(lugares).id,
        },
      });
    })
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

  console.log('=> Creando datos de demostración de Personal...');
  const demoPersonal = await seedPersonal(clientes[0].id, lugares[0].id);

  console.log('=> Creando datos de demostración de Equipos...');
  await seedEquipos(demoPersonal);

  console.log('--- Seed completado :V ---');
  
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await prismaApp.$disconnect();
  });