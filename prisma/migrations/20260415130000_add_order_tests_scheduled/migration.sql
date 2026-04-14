-- Migration: add_order_tests_scheduled
-- 1. Extend OrderStatus enum with SCHEDULED

ALTER TYPE "OrderStatus" ADD VALUE 'SCHEDULED';

-- 2. Add doctorId FK to orders → users
ALTER TABLE "orders" ADD COLUMN "doctorId" TEXT;
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Create order_tests table
CREATE TABLE "order_tests" (
  "id"        TEXT NOT NULL,
  "orderId"   TEXT NOT NULL,
  "examCode"  TEXT NOT NULL,
  "examName"  TEXT NOT NULL,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "updatedBy" TEXT,

  CONSTRAINT "order_tests_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "order_tests"
  ADD CONSTRAINT "order_tests_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
