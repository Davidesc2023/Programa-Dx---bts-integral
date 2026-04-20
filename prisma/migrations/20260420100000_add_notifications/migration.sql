-- AlterTable: make User.email nullable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- CreateEnum: NotificationType
DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'CONSENT_REQUEST',
    'CONSENT_RESPONDED',
    'ORDER_CREATED',
    'ORDER_UPDATED',
    'RESULT_READY',
    'APPOINTMENT_SCHEDULED',
    'GENERAL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: notifications
CREATE TABLE "notifications" (
  "id"        TEXT        NOT NULL,
  "userId"    TEXT        NOT NULL,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT        NOT NULL,
  "message"   TEXT        NOT NULL,
  "isRead"    BOOLEAN     NOT NULL DEFAULT false,
  "metadata"  JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
