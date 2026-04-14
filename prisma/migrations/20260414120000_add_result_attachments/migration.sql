-- Migration: add_result_attachments
-- Generated: 2026-04-14
-- Description: Adds ResultAttachment model for storing file attachments linked to lab results

CREATE TABLE "result_attachments" (
    "id"           TEXT NOT NULL,
    "resultId"     TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType"     TEXT NOT NULL,
    "size"         INTEGER NOT NULL,
    "filePath"     TEXT NOT NULL,
    "deletedAt"    TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy"    TEXT,
    "updatedBy"    TEXT,

    CONSTRAINT "result_attachments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "result_attachments"
    ADD CONSTRAINT "result_attachments_resultId_fkey"
    FOREIGN KEY ("resultId")
    REFERENCES "results"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
