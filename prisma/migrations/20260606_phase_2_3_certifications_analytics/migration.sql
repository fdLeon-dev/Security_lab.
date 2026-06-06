ALTER TABLE "Certification" RENAME COLUMN "examDate" TO "targetDate";
ALTER TABLE "Certification" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "Certification" ADD COLUMN "completionDate" TIMESTAMP(3);
ALTER TABLE "Certification" ADD COLUMN "notes" TEXT;

UPDATE "Certification"
SET "completionDate" = COALESCE("completionDate", NOW())
WHERE "status" = 'COMPLETED' AND "completionDate" IS NULL;

CREATE INDEX IF NOT EXISTS "Certification_userId_status_idx" ON "Certification"("userId", "status");
