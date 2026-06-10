-- CreateEnum
CREATE TYPE "LabTestType" AS ENUM ('NIVEL_SERICO', 'GENETICO', 'PANEL', 'IMAGEN', 'MICROBIOLOGIA', 'OTRO');

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LabTestType" NOT NULL DEFAULT 'OTRO',
    "category" TEXT,
    "description" TEXT,
    "instructions" TEXT,
    "estimatedHours" INTEGER,
    "requiresResultFromId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_tests_code_key" ON "lab_tests"("code");

-- AddForeignKey (self-referencing prerequisite)
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_requiresResultFromId_fkey" FOREIGN KEY ("requiresResultFromId") REFERENCES "lab_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: add labTestId to order_tests
ALTER TABLE "order_tests" ADD COLUMN "labTestId" TEXT;

-- AddForeignKey
ALTER TABLE "order_tests" ADD CONSTRAINT "order_tests_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "lab_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
