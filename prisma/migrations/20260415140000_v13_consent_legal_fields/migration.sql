-- Migration: v13 — Consent Legal Fields (PDF + S3 + Doble Firma)
-- Ley 1581/2012 Colombia — Consentimiento Informado

ALTER TABLE "consents"
  ADD COLUMN "doctorNameSnapshot"  TEXT,
  ADD COLUMN "patientNameSnapshot" TEXT,
  ADD COLUMN "patientSignedAt"     TIMESTAMP(3),
  ADD COLUMN "accepted"            BOOLEAN,
  ADD COLUMN "documentHtml"        TEXT,
  ADD COLUMN "documentPdfUrl"      TEXT;
