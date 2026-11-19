-- CreateTable
CREATE TABLE "disponibilidad_trabajador" (
    "trabajadorId" INTEGER NOT NULL,
    "dia" "DiaSemana" NOT NULL,

    CONSTRAINT "disponibilidad_trabajador_pkey" PRIMARY KEY ("trabajadorId","dia")
);

-- AddForeignKey
ALTER TABLE "disponibilidad_trabajador" ADD CONSTRAINT "disponibilidad_trabajador_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copiar los días existentes a la tabla normalizada.
-- No elimina información de la tabla trabajadores.

INSERT INTO "disponibilidad_trabajador" ("trabajadorId", "dia")
SELECT
    t."id",
    dias.dia
FROM "trabajadores" AS t
CROSS JOIN LATERAL
    unnest(t."disponibilidadDias") AS dias(dia)
ON CONFLICT ("trabajadorId", "dia") DO NOTHING;