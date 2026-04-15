-- Migration: add_patient_portal
-- Adds PACIENTE to UserRole enum and userId FK on patients table

-- ── UserRole: add PACIENTE value ──────────────────────────────────────────────
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PACIENTE';

-- ── Patients: add userId FK for portal account link ──────────────────────────
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "patients" ADD CONSTRAINT IF NOT EXISTS "patients_userId_key" UNIQUE ("userId");
ALTER TABLE "patients" ADD CONSTRAINT IF NOT EXISTS "patients_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
