-- CreateEnum
CREATE TYPE "TipoFeedback" AS ENUM ('OPINION', 'SUGERENCIA', 'RECLAMO');

-- CreateEnum
CREATE TYPE "EstadoInvitacionFeedback" AS ENUM ('ENVIANDO', 'ENVIADA', 'ERROR', 'RESPONDIDA');

-- AlterTable
ALTER TABLE "reclamos" ADD COLUMN     "tipoFeedback" "TipoFeedback" NOT NULL DEFAULT 'RECLAMO';

-- CreateTable
CREATE TABLE "invitaciones_feedback" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "estado" "EstadoInvitacionFeedback" NOT NULL DEFAULT 'ENVIANDO',
    "enviadoAt" TIMESTAMP(3),
    "respondidoAt" TIMESTAMP(3),
    "expiraAt" TIMESTAMP(3) NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ultimoError" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitaciones_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_feedback_eventoId_key" ON "invitaciones_feedback"("eventoId");

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_feedback_tokenHash_key" ON "invitaciones_feedback"("tokenHash");

-- AddForeignKey
ALTER TABLE "invitaciones_feedback" ADD CONSTRAINT "invitaciones_feedback_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
