-- Migration: add_consent_module
-- Adds MEDICO role, consent-related OrderStatus values, ConsentStatus enum, and Consent model

-- AlterEnum: Add MEDICO to UserRole
ALTER TYPE "UserRole" ADD VALUE 'MEDICO';

-- AlterEnum: Add CONSENT_PENDING and ACCEPTED to OrderStatus
ALTER TYPE "OrderStatus" ADD VALUE 'CONSENT_PENDING';
ALTER TYPE "OrderStatus" ADD VALUE 'ACCEPTED';

-- CreateEnum: ConsentStatus
CREATE TYPE "ConsentStatus" AS ENUM (
  'PENDIENTE_FIRMA_MEDICO',
  'FIRMADO_MEDICO',
  'ENVIADO_PACIENTE',
  'ACEPTADO',
  'RECHAZADO'
);

-- CreateTable: consents
CREATE TABLE "consents" (
    "id"                TEXT NOT NULL,
    "orderId"           TEXT NOT NULL,
    "status"            "ConsentStatus" NOT NULL DEFAULT 'PENDIENTE_FIRMA_MEDICO',
    "doctorId"          TEXT,
    "doctorSignedAt"    TIMESTAMP(3),
    "patientResponseAt" TIMESTAMP(3),
    "notes"             TEXT,
    "deletedAt"         TIMESTAMP(3),
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    "createdBy"         TEXT,
    "updatedBy"         TEXT,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique orderId in consents (1 consent per order)
CREATE UNIQUE INDEX "consents_orderId_key" ON "consents"("orderId");

-- AddForeignKey: consents.orderId -> orders.id
ALTER TABLE "consents"
    ADD CONSTRAINT "consents_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: consents.doctorId -> users.id
ALTER TABLE "consents"
    ADD CONSTRAINT "consents_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
