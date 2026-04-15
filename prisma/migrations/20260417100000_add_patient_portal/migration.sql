-- Migration: add_patient_portal
-- Adds PACIENTE to UserRole enum and userId FK on patients table
-- Written fully idempotent for safe re-execution after partial failure.

-- ── UserRole: add PACIENTE value ──────────────────────────────────────────────
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PACIENTE';

-- ── Patients: add userId FK for portal account link ──────────────────────────
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- UNIQUE constraint (idempotent via DO block — works on PostgreSQL 9.6+)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patients_userId_key'
  ) THEN
    ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_key" UNIQUE ("userId");
  END IF;
END$$;

-- FK constraint (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patients_userId_fkey'
  ) THEN
    ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
