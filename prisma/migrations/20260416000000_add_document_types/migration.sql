-- AlterEnum
-- Add Colombian document types: CC (Cédula de Ciudadanía), TI (Tarjeta de Identidad), RC (Registro Civil)
ALTER TYPE "DocumentType" ADD VALUE 'CC';
ALTER TYPE "DocumentType" ADD VALUE 'TI';
ALTER TYPE "DocumentType" ADD VALUE 'RC';
