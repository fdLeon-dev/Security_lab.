CREATE TYPE "SiemAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'CLOSED');
CREATE TYPE "SiemEventCategory" AS ENUM ('AUTHENTICATION', 'NETWORK', 'SYSTEM', 'APPLICATION', 'ENDPOINT', 'AUDIT');

ALTER TABLE "SiemEvent" RENAME COLUMN "eventType" TO "category";
ALTER TABLE "SiemEvent" RENAME COLUMN "details" TO "description";
ALTER TABLE "SiemEvent" ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMP(3);
ALTER TABLE "SiemEvent" DROP COLUMN IF EXISTS "status";

UPDATE "SiemEvent"
SET
  "timestamp" = COALESCE("timestamp", "createdAt"),
  "category" = CASE
    WHEN "category" ILIKE '%auth%' THEN 'AUTHENTICATION'
    WHEN "category" ILIKE '%network%' THEN 'NETWORK'
    WHEN "category" ILIKE '%system%' THEN 'SYSTEM'
    WHEN "category" ILIKE '%app%' THEN 'APPLICATION'
    WHEN "category" ILIKE '%endpoint%' THEN 'ENDPOINT'
    WHEN "category" ILIKE '%audit%' THEN 'AUDIT'
    ELSE 'SYSTEM'
  END
WHERE "timestamp" IS NULL OR "category" IS NOT NULL;

ALTER TABLE "SiemEvent"
  ALTER COLUMN "timestamp" SET NOT NULL,
  ALTER COLUMN "category" TYPE "SiemEventCategory"
  USING "category"::"SiemEventCategory";

ALTER TABLE "SiemRule" ADD COLUMN IF NOT EXISTS "userId" TEXT;
UPDATE "SiemRule"
SET "userId" = COALESCE("userId", (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1));
ALTER TABLE "SiemRule" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "SiemRule" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS "SiemAlert" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "ruleId" TEXT,
  "title" TEXT NOT NULL,
  "severity" INTEGER NOT NULL,
  "status" "SiemAlertStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiemAlert_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'SiemEvent_userId_fkey'
  ) THEN
    ALTER TABLE "SiemEvent"
      ADD CONSTRAINT "SiemEvent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'SiemRule_userId_fkey'
  ) THEN
    ALTER TABLE "SiemRule"
      ADD CONSTRAINT "SiemRule_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'SiemAlert_userId_fkey'
  ) THEN
    ALTER TABLE "SiemAlert"
      ADD CONSTRAINT "SiemAlert_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'SiemAlert_eventId_fkey'
  ) THEN
    ALTER TABLE "SiemAlert"
      ADD CONSTRAINT "SiemAlert_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "SiemEvent"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'SiemAlert_ruleId_fkey'
  ) THEN
    ALTER TABLE "SiemAlert"
      ADD CONSTRAINT "SiemAlert_ruleId_fkey"
      FOREIGN KEY ("ruleId") REFERENCES "SiemRule"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "SiemEvent_userId_category_idx" ON "SiemEvent"("userId", "category");
CREATE INDEX IF NOT EXISTS "SiemEvent_userId_severity_idx" ON "SiemEvent"("userId", "severity");
CREATE INDEX IF NOT EXISTS "SiemEvent_userId_timestamp_idx" ON "SiemEvent"("userId", "timestamp");
CREATE INDEX IF NOT EXISTS "SiemRule_userId_severity_idx" ON "SiemRule"("userId", "severity");
CREATE INDEX IF NOT EXISTS "SiemRule_userId_enabled_idx" ON "SiemRule"("userId", "enabled");
CREATE INDEX IF NOT EXISTS "SiemAlert_userId_status_idx" ON "SiemAlert"("userId", "status");
CREATE INDEX IF NOT EXISTS "SiemAlert_userId_severity_idx" ON "SiemAlert"("userId", "severity");
CREATE INDEX IF NOT EXISTS "SiemAlert_eventId_status_idx" ON "SiemAlert"("eventId", "status");