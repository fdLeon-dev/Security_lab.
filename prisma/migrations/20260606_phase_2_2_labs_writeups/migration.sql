CREATE TYPE "LabPlatform" AS ENUM ('HACK_THE_BOX', 'TRY_HACK_ME', 'PORTSWIGGER', 'DOCKER_LABS', 'LOCAL_LAB');
CREATE TYPE "LabCategory" AS ENUM ('LINUX', 'WINDOWS', 'WEB', 'ACTIVE_DIRECTORY', 'CLOUD', 'NETWORK');
CREATE TYPE "WriteupCategory" AS ENUM ('LINUX', 'WINDOWS', 'WEB', 'ACTIVE_DIRECTORY', 'CLOUD', 'NETWORK');
CREATE TYPE "WriteupVisibility" AS ENUM ('PRIVATE', 'INTERNAL', 'PUBLIC');

ALTER TABLE "LabEntry" RENAME COLUMN "name" TO "title";
ALTER TABLE "LabEntry" RENAME COLUMN "date" TO "completedAt";
ALTER TABLE "LabEntry" ALTER COLUMN "completedAt" DROP NOT NULL;
ALTER TABLE "LabEntry" DROP COLUMN IF EXISTS "evidenceUrl";
ALTER TABLE "LabEntry"
  ALTER COLUMN "platform" TYPE "LabPlatform"
  USING (
    CASE "platform"
      WHEN 'Hack The Box' THEN 'HACK_THE_BOX'
      WHEN 'TryHackMe' THEN 'TRY_HACK_ME'
      WHEN 'PortSwigger' THEN 'PORTSWIGGER'
      WHEN 'Docker Labs' THEN 'DOCKER_LABS'
      WHEN 'Laboratorios propios' THEN 'LOCAL_LAB'
      WHEN 'Local Lab' THEN 'LOCAL_LAB'
      ELSE 'LOCAL_LAB'
    END
  )::"LabPlatform";
ALTER TABLE "LabEntry"
  ALTER COLUMN "category" TYPE "LabCategory"
  USING (
    CASE "category"
      WHEN 'Linux' THEN 'LINUX'
      WHEN 'Windows' THEN 'WINDOWS'
      WHEN 'Web' THEN 'WEB'
      WHEN 'Active Directory' THEN 'ACTIVE_DIRECTORY'
      WHEN 'Cloud' THEN 'CLOUD'
      WHEN 'Network' THEN 'NETWORK'
      WHEN 'Redes' THEN 'NETWORK'
      WHEN 'SIEM' THEN 'NETWORK'
      ELSE 'WEB'
    END
  )::"LabCategory";
CREATE INDEX IF NOT EXISTS "LabEntry_userId_category_idx" ON "LabEntry"("userId", "category");
CREATE INDEX IF NOT EXISTS "LabEntry_userId_status_idx" ON "LabEntry"("userId", "status");

ALTER TABLE "Writeup" RENAME COLUMN "contentMdx" TO "content";
ALTER TABLE "Writeup" ADD COLUMN "slug" TEXT;
ALTER TABLE "Writeup" ADD COLUMN "visibility" "WriteupVisibility" NOT NULL DEFAULT 'PRIVATE';
UPDATE "Writeup"
SET "slug" = regexp_replace(lower(trim("title")), '[^a-z0-9]+', '-', 'g') || '-' || left("id", 6)
WHERE "slug" IS NULL;
ALTER TABLE "Writeup" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Writeup"
  ALTER COLUMN "category" TYPE "WriteupCategory"
  USING (
    CASE "category"
      WHEN 'Linux' THEN 'LINUX'
      WHEN 'Windows' THEN 'WINDOWS'
      WHEN 'Web' THEN 'WEB'
      WHEN 'Active Directory' THEN 'ACTIVE_DIRECTORY'
      WHEN 'Cloud' THEN 'CLOUD'
      WHEN 'Network' THEN 'NETWORK'
      WHEN 'Redes' THEN 'NETWORK'
      ELSE 'WEB'
    END
  )::"WriteupCategory";
CREATE UNIQUE INDEX IF NOT EXISTS "Writeup_slug_key" ON "Writeup"("slug");
CREATE INDEX IF NOT EXISTS "Writeup_userId_visibility_idx" ON "Writeup"("userId", "visibility");
