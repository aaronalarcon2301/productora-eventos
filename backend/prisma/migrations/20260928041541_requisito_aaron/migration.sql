-- CreateEnum
CREATE TYPE "RolTrabajador" AS ENUM ('TECNICO_SONIDO', 'TECNICO_ILUMINACION', 'MONTAJISTA', 'ANIMADOR', 'GARZON', 'ANFITRION', 'ASEO_LOGISTICA', 'SEGURIDAD');

-- CreateEnum
CREATE TYPE "TipoIncidente" AS ENUM ('INASISTENCIA', 'FALTA_GRAVE');

-- CreateTable
CREATE TABLE "trabajadores" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "rolPrincipal" "RolTrabajador" NOT NULL,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "promedioGeneral" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "rolEvento" "RolTrabajador" NOT NULL,
    "puntualidad" INTEGER NOT NULL,
    "comentarioPuntualidad" TEXT,
    "trato" INTEGER NOT NULL,
    "comentarioTrato" TEXT,
    "eficiencia" INTEGER NOT NULL,
    "comentarioEficiencia" TEXT,
    "manejoEquipos" INTEGER,
    "comentarioManejoEquipos" TEXT,
    "promedioEvaluacion" DOUBLE PRECISION NOT NULL,
    "adminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidentes" (
    "id" SERIAL NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "eventoId" INTEGER,
    "tipo" "TipoIncidente" NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluaciones_trabajadorId_eventoId_key" ON "evaluaciones"("trabajadorId", "eventoId");

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidentes" ADD CONSTRAINT "incidentes_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidentes" ADD CONSTRAINT "incidentes_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
