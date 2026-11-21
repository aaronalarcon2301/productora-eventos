-- AlterEnum
ALTER TYPE "RolUsuario" ADD VALUE 'PERSONAL';

-- CreateEnum
CREATE TYPE "RespuestaAsignacion" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'RECHAZADA');

-- AlterTable
ALTER TABLE "asignaciones_trabajador" ADD COLUMN     "comentarioRespuesta" VARCHAR(200),
ADD COLUMN     "respondidaAt" TIMESTAMP(3),
ADD COLUMN     "respuesta" "RespuestaAsignacion" NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "trabajadores" ADD COLUMN     "usuarioId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_usuarioId_key" ON "trabajadores"("usuarioId");

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
