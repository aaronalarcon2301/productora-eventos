-- CreateEnum
CREATE TYPE "TurnoAsignacion" AS ENUM ('DIURNO', 'NOCTURNO');

-- CreateEnum
CREATE TYPE "EstadoNotificacionTurno" AS ENUM ('PENDIENTE', 'ENVIANDO', 'ENVIADA', 'ERROR');

-- AlterTable
ALTER TABLE "asignaciones_trabajador" ADD COLUMN     "horaLlegada" VARCHAR(5),
ADD COLUMN     "notificacionEnviadaAt" TIMESTAMP(3),
ADD COLUMN     "notificacionError" VARCHAR(255),
ADD COLUMN     "notificacionEstado" "EstadoNotificacionTurno" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "turno" "TurnoAsignacion";
