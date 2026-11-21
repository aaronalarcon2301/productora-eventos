import prisma from "../config/prisma.js";
import { httpError } from "../utils/http.js";

export async function recalcularPromedioGeneral(trabajadorId, db = prisma) {
  const evaluaciones = await db.evaluacion.findMany({
    where: { trabajadorId },
    select: { promedioEvaluacion: true },
  });

  const promedioGeneral =
    evaluaciones.length === 0
      ? null
      : Number(
          (
            evaluaciones.reduce((suma, e) => suma + e.promedioEvaluacion, 0) /
            evaluaciones.length
          ).toFixed(2)
        );

  await db.trabajador.update({
    where: { id: trabajadorId },
    data: { promedioGeneral },
  });
}

function normalizarDisponibilidad(trabajador) {
  const { disponibilidades = [], ...resto } = trabajador;

  return {
    ...resto,
    disponibilidadDias: disponibilidades.map(item => item.dia)
  };
}

function ocultarCuenta(trabajador) {
  const normalizado = normalizarDisponibilidad(trabajador);

  const { numeroCuenta, ...resto } = normalizado;

  return {
    ...resto,
    numeroCuentaUltimos4: numeroCuenta
      ? numeroCuenta.slice(-4)
      : null
  };
}

function errorSiRutDuplicado(err) {
  if (err.code === "P2002") {
    throw httpError(409, "Ya existe un trabajador registrado con ese RUT.");
  }
  throw err;
}

export async function listarTrabajadores(filtros = {}) {
  const where = filtros.asignables ? { activo: true, bloqueado: false } : {};

  const trabajadores = await prisma.trabajador.findMany({
    where,
    orderBy: { nombre: "asc" },
    include: {
    disponibilidades: {
    select: {
      dia: true
    }
  },
  _count: {
    select: {
      evaluaciones: true,
      incidentes: true
    }
  }
},
  });
  return trabajadores.map(ocultarCuenta);
}

export async function obtenerTrabajador(id) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id },
    include: {
      disponibilidades: {
        select: {
          dia: true
        }
      }
    }
  });

  if (!trabajador) {
    throw httpError(404, "Trabajador no encontrado.");
  }

  return normalizarDisponibilidad(trabajador);
}

export async function crearTrabajador(data) {
  try {
    const { disponibilidadDias, ...otrosDatos } = data;

    const dias = [...new Set(disponibilidadDias ?? [])];

    const trabajador = await prisma.trabajador.create({
      data: {
        ...otrosDatos,

        ...(dias.length > 0
          ? {
              disponibilidades: {
                create: dias.map(dia => ({ dia }))
              }
            }
          : {})
      },

      include: {
        disponibilidades: {
          select: {
            dia: true
          }
        }
      }
    });

    return ocultarCuenta(trabajador);

  } catch (err) {
    return errorSiRutDuplicado(err);
  }
}

export async function actualizarTrabajador(id, data) {
  await obtenerTrabajador(id);

  try {
    const { disponibilidadDias, ...otrosDatos } = data;

    const dias = disponibilidadDias === undefined
      ? undefined
      : [...new Set(disponibilidadDias)];

    const trabajador = await prisma.$transaction(async (tx) => {

      await tx.trabajador.update({
        where: { id },
        data: otrosDatos
      });

      if (dias !== undefined) {

        await tx.disponibilidadTrabajador.deleteMany({
          where: { trabajadorId: id }
        });

        if (dias.length > 0) {
          await tx.disponibilidadTrabajador.createMany({
            data: dias.map(dia => ({
              trabajadorId: id,
              dia
            }))
          });
        }
      }

      return tx.trabajador.findUnique({
        where: { id },
        include: {
          disponibilidades: {
            select: {
              dia: true
            }
          }
        }
      });
    });

    return ocultarCuenta(trabajador);

  } catch (err) {
    return errorSiRutDuplicado(err);
  }
}

export async function eliminarTrabajador(id) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id },
    include: { _count: { select: { evaluaciones: true, incidentes: true, asignaciones: true } } },
  });
  if (!trabajador) throw httpError(404, "Trabajador no encontrado.");

  const { evaluaciones, incidentes, asignaciones } = trabajador._count;
  const tieneHistorial = evaluaciones + incidentes + asignaciones > 0;

  if (tieneHistorial) {
    await prisma.trabajador.update({ where: { id }, data: { activo: false } });
    return {
      accion: "INACTIVADO",
      mensaje:
        "El trabajador tiene historial (evaluaciones, incidentes o asignaciones), por lo que no se eliminó: quedó como inactivo y conserva su historial.",
    };
  }

  await prisma.trabajador.delete({ where: { id } });
  if (trabajador.usuarioId) {
    await prisma.usuario.deleteMany({ where: { id: trabajador.usuarioId } });
  }
  return { accion: "ELIMINADO", mensaje: "Trabajador eliminado correctamente." };
}

export async function obtenerHistorial(trabajadorId) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: trabajadorId },
    include: {
      evaluaciones: {
        orderBy: { createdAt: "desc" },
        include: { evento: { select: { id: true, nombre: true, fecha: true } } },
      },
      incidentes: {
        orderBy: { createdAt: "desc" },
        include: { evento: { select: { id: true, nombre: true } } },
      },
    },
      disponibilidades: {
        select: {
        dia: true
      }
    },
  });

  if (!trabajador) return null;

  const auditoria = await prisma.auditoriaEvaluacion.findMany({
    where: { trabajadorId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      evaluacionId: true,
      eventoId: true,
      accion: true,
      motivo: true,
      adminId: true,
      createdAt: true,
    },
  });

  const notasPorRol = {};
  for (const ev of trabajador.evaluaciones) {
    if (!notasPorRol[ev.rolEvento]) notasPorRol[ev.rolEvento] = [];
    notasPorRol[ev.rolEvento].push(ev.promedioEvaluacion);
  }

  const promedioPorRol = {};
  for (const rol in notasPorRol) {
    const notas = notasPorRol[rol];
    promedioPorRol[rol] = Number(
      (notas.reduce((suma, n) => suma + n, 0) / notas.length).toFixed(2)
    );
  }

  let estado = "ACTIVO";
  if (trabajador.bloqueado) estado = "BLOQUEADO";
  else if (!trabajador.activo) estado = "INACTIVO";

  return {
    id: trabajador.id,
    nombre: trabajador.nombre,
    rolPrincipal: trabajador.rolPrincipal,
    rut: trabajador.rut,
    email: trabajador.email,
    telefono: trabajador.telefono,
    comuna: trabajador.comuna,
    aniosExperiencia: trabajador.aniosExperiencia,
    disponibilidadDias: trabajador.disponibilidades.map(
      item => item.dia
    ),
    disponibilidadTurno: trabajador.disponibilidadTurno,
    tallaUniforme: trabajador.tallaUniforme,
    estado,
    promedioGeneral: trabajador.promedioGeneral,
    promediosPorRol: promedioPorRol,
    evaluaciones: trabajador.evaluaciones,
    incidentes: trabajador.incidentes,
    auditoria,
    totalEvaluaciones: trabajador.evaluaciones.length,
    totalIncidentes: trabajador.incidentes.length,
    disponibleParaContratar: trabajador.activo && !trabajador.bloqueado,
  };
}
