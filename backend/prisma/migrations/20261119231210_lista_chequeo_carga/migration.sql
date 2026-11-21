-- AlterTable
ALTER TABLE "detalles_cotizacion_equipo" ADD COLUMN     "cantidadCargada" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cargaActualizadaAt" TIMESTAMP(3),
ADD COLUMN     "cargaActualizadaPorId" INTEGER,
ADD COLUMN     "observacionCarga" VARCHAR(255);

-- AddForeignKey
ALTER TABLE "detalles_cotizacion_equipo" ADD CONSTRAINT "detalles_cotizacion_equipo_cargaActualizadaPorId_fkey" FOREIGN KEY ("cargaActualizadaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
