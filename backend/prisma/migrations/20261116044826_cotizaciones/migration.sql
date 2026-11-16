-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "costoServicios" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "detalles_cotizacion_equipo" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "equipoId" INTEGER,
    "nombreEquipo" VARCHAR(100) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "diasArriendo" INTEGER NOT NULL,
    "precioUnitarioDia" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "detalles_cotizacion_equipo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "detalles_cotizacion_equipo_eventoId_equipoId_key" ON "detalles_cotizacion_equipo"("eventoId", "equipoId");

-- AddForeignKey
ALTER TABLE "detalles_cotizacion_equipo" ADD CONSTRAINT "detalles_cotizacion_equipo_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_cotizacion_equipo" ADD CONSTRAINT "detalles_cotizacion_equipo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "equipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
