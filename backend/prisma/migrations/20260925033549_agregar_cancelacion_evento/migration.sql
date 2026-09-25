-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "cancelado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaCancelacion" TIMESTAMP(3),
ADD COLUMN     "fechaPago" TIMESTAMP(3),
ADD COLUMN     "montoAbono" DOUBLE PRECISION,
ADD COLUMN     "montoDevolucion" DOUBLE PRECISION;
