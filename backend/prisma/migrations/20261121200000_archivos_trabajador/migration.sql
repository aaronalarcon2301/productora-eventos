-- CreateTable
CREATE TABLE "archivos_trabajador" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "tipo" VARCHAR(100) NOT NULL,
    "tamano" INTEGER NOT NULL,
    "contenido" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_trabajador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "archivos_trabajador_trabajadorId_idx" ON "archivos_trabajador"("trabajadorId");

-- AddForeignKey
ALTER TABLE "archivos_trabajador" ADD CONSTRAINT "archivos_trabajador_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
