-- CreateEnum
CREATE TYPE "CategoriaReclamo" AS ENUM ('EQUIPAMIENTO', 'PERSONAL_ATENCION', 'COBROS_PAGOS', 'MONTAJE_LOGISTICA', 'OTROS');

-- CreateEnum
CREATE TYPE "AreaReclamo" AS ENUM ('AREA_TECNICA', 'OPERACIONES', 'ADMINISTRACION', 'LOGISTICA', 'ATENCION_CLIENTE');

-- CreateEnum
CREATE TYPE "EstadoReclamo" AS ENUM ('PENDIENTE', 'EN_REVISION', 'RESUELTO');

-- AlterTable
ALTER TABLE "reclamos" ADD COLUMN     "areaResponsable" "AreaReclamo" NOT NULL DEFAULT 'ATENCION_CLIENTE',
ADD COLUMN     "categoria" "CategoriaReclamo" NOT NULL DEFAULT 'OTROS',
ADD COLUMN     "estado" "EstadoReclamo" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaResolucion" TIMESTAMP(3),
ADD COLUMN     "responsableId" INTEGER,
ADD COLUMN     "respuesta" TEXT;

-- AddForeignKey
ALTER TABLE "reclamos" ADD CONSTRAINT "reclamos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
