-- CreateTable
CREATE TABLE "PoliticaDevolucion" (
    "id" SERIAL NOT NULL,
    "diasDesde" INTEGER NOT NULL,
    "diasHasta" INTEGER,
    "porcentaje" INTEGER NOT NULL,

    CONSTRAINT "PoliticaDevolucion_pkey" PRIMARY KEY ("id")
);
