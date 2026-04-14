-- Migration: expand_user_patient_order_fields
-- Adds clinical/personal fields to users, patients, and orders

-- ── Users: personal + clinical fields ────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firstName"      TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastName"       TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "documentType"   "DocumentType";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "documentNumber" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone"          TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "specialty"      TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "medicalLicense" TEXT;

-- ── Patients: location fields ────────────────────────────────────────────────
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "city"      TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "address"   TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "insurance" TEXT;

-- ── Orders: clinical justification ──────────────────────────────────────────
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "diagnosis" TEXT;
