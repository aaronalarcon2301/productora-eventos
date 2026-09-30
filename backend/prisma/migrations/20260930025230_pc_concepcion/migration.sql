/*
  Warnings:

  - You are about to drop the column `comentarioEficiencia` on the `evaluaciones` table. All the data in the column will be lost.
  - You are about to drop the column `comentarioManejoEquipos` on the `evaluaciones` table. All the data in the column will be lost.
  - You are about to drop the column `comentarioPuntualidad` on the `evaluaciones` table. All the data in the column will be lost.
  - You are about to drop the column `comentarioTrato` on the `evaluaciones` table. All the data in the column will be lost.
  - You are about to drop the column `eficiencia` on the `evaluaciones` table. All the data in the column will be lost.
  - You are about to drop the column `manejoEquipos` on the `evaluaciones` table. All the data in the column will be lost.
  - You are about to drop the column `puntualidad` on the `evaluaciones` table. All the data in the column will be lost.
  - You are about to drop the column `trato` on the `evaluaciones` table. All the data in the column will be lost.
  - Added the required column `atencion` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autonomia` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `comunicacion` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conducta` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cumplimiento` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cumplimientoHorarios` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `llegada` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promedioEficiencia` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promedioPuntualidad` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promedioTrato` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resolucion` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tiemposPreparacion` to the `evaluaciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "evaluaciones" DROP COLUMN "comentarioEficiencia",
DROP COLUMN "comentarioManejoEquipos",
DROP COLUMN "comentarioPuntualidad",
DROP COLUMN "comentarioTrato",
DROP COLUMN "eficiencia",
DROP COLUMN "manejoEquipos",
DROP COLUMN "puntualidad",
DROP COLUMN "trato",
ADD COLUMN     "atencion" INTEGER NOT NULL,
ADD COLUMN     "autonomia" INTEGER NOT NULL,
ADD COLUMN     "comentarioAtencion" TEXT,
ADD COLUMN     "comentarioAutonomia" TEXT,
ADD COLUMN     "comentarioComunicacion" TEXT,
ADD COLUMN     "comentarioConducta" TEXT,
ADD COLUMN     "comentarioCuidadoEquipos" TEXT,
ADD COLUMN     "comentarioCumplimiento" TEXT,
ADD COLUMN     "comentarioCumplimientoHorarios" TEXT,
ADD COLUMN     "comentarioLlegada" TEXT,
ADD COLUMN     "comentarioResolucion" TEXT,
ADD COLUMN     "comentarioResolucionTecnica" TEXT,
ADD COLUMN     "comentarioTiemposPreparacion" TEXT,
ADD COLUMN     "comentarioUsoEquipos" TEXT,
ADD COLUMN     "comunicacion" INTEGER NOT NULL,
ADD COLUMN     "conducta" INTEGER NOT NULL,
ADD COLUMN     "cuidadoEquipos" INTEGER,
ADD COLUMN     "cumplimiento" INTEGER NOT NULL,
ADD COLUMN     "cumplimientoHorarios" INTEGER NOT NULL,
ADD COLUMN     "llegada" INTEGER NOT NULL,
ADD COLUMN     "promedioEficiencia" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "promedioManejoEquipos" DOUBLE PRECISION,
ADD COLUMN     "promedioPuntualidad" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "promedioTrato" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "resolucion" INTEGER NOT NULL,
ADD COLUMN     "resolucionTecnica" INTEGER,
ADD COLUMN     "tiemposPreparacion" INTEGER NOT NULL,
ADD COLUMN     "usoEquipos" INTEGER;
