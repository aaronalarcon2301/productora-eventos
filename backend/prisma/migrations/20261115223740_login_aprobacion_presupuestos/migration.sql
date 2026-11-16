/*
  Warnings:

  - A unique constraint covering the columns `[rut]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rut]` on the table `trabajadores` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AccionEvaluacion" AS ENUM ('EDITADA', 'ELIMINADA');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "TurnoDisponible" AS ENUM ('DIURNO', 'NOCTURNO', 'AMBOS');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('CORRIENTE', 'VISTA', 'CUENTA_RUT', 'AHORRO');

-- CreateEnum
CREATE TYPE "CategoriaEquipo" AS ENUM ('SONIDO', 'ILUMINACION', 'AUDIOVISUAL', 'MOBILIARIO', 'ESTRUCTURA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('RESERVADO', 'ENTREGADO', 'DEVUELTO');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('GERENTE', 'TRABAJADOR');

-- CreateEnum
CREATE TYPE "EstadoPresupuesto" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "rut" VARCHAR(12);

-- AlterTable
ALTER TABLE "evaluaciones" ADD COLUMN     "modificadoPorId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "creadoPorId" INTEGER,
ADD COLUMN     "estadoPresupuesto" "EstadoPresupuesto" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "finalizadoAt" TIMESTAMP(3),
ADD COLUMN     "revisadoAt" TIMESTAMP(3),
ADD COLUMN     "revisadoPorId" INTEGER;

-- AlterTable
ALTER TABLE "trabajadores" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aniosExperiencia" INTEGER,
ADD COLUMN     "banco" VARCHAR(60),
ADD COLUMN     "comuna" VARCHAR(80),
ADD COLUMN     "disponibilidadDias" "DiaSemana"[] DEFAULT ARRAY[]::"DiaSemana"[],
ADD COLUMN     "disponibilidadTurno" "TurnoDisponible",
ADD COLUMN     "email" VARCHAR(120),
ADD COLUMN     "numeroCuenta" VARCHAR(30),
ADD COLUMN     "rut" VARCHAR(12),
ADD COLUMN     "tallaUniforme" VARCHAR(10),
ADD COLUMN     "telefono" VARCHAR(20),
ADD COLUMN     "tipoCuenta" "TipoCuenta";

-- CreateTable
CREATE TABLE "asignaciones_trabajador" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "rol" "RolTrabajador" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaciones_trabajador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_evaluaciones" (
    "id" SERIAL NOT NULL,
    "evaluacionId" INTEGER NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "accion" "AccionEvaluacion" NOT NULL,
    "motivo" TEXT,
    "adminId" INTEGER,
    "datosAnteriores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "categoria" "CategoriaEquipo" NOT NULL,
    "descripcion" VARCHAR(255),
    "cantidadTotal" INTEGER NOT NULL,
    "cantidadMantencion" INTEGER NOT NULL DEFAULT 0,
    "precioArriendoDia" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_equipo" (
    "id" SERIAL NOT NULL,
    "equipoId" INTEGER NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "responsableId" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'RESERVADO',
    "cantidadDanada" INTEGER NOT NULL DEFAULT 0,
    "cantidadFaltante" INTEGER NOT NULL DEFAULT 0,
    "observacion" VARCHAR(255),
    "entregadaAt" TIMESTAMP(3),
    "devueltaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" SERIAL NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_trabajador_trabajadorId_eventoId_key" ON "asignaciones_trabajador"("trabajadorId", "eventoId");

-- CreateIndex
CREATE INDEX "auditoria_evaluaciones_trabajadorId_idx" ON "auditoria_evaluaciones"("trabajadorId");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_nombre_key" ON "equipos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_equipo_equipoId_eventoId_key" ON "reservas_equipo"("equipoId", "eventoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_tokenHash_key" ON "sesiones"("tokenHash");

-- CreateIndex
CREATE INDEX "sesiones_expiresAt_idx" ON "sesiones"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_rut_key" ON "clientes"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_rut_key" ON "trabajadores"("rut");

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_trabajador" ADD CONSTRAINT "asignaciones_trabajador_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_trabajador" ADD CONSTRAINT "asignaciones_trabajador_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_equipo" ADD CONSTRAINT "reservas_equipo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_equipo" ADD CONSTRAINT "reservas_equipo_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_equipo" ADD CONSTRAINT "reservas_equipo_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "trabajadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
