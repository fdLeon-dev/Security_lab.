ALTER TABLE "InventoryAsset" RENAME TO "Asset";
ALTER TABLE "Asset" RENAME COLUMN "os" TO "operatingSystem";
ALTER TABLE "Asset" DROP COLUMN IF EXISTS "topologyLabel";
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "manufacturer" TEXT;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "networkId" TEXT;

CREATE TABLE IF NOT EXISTS "Network" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subnet" TEXT NOT NULL,
  "gateway" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Network_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VirtualMachine" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assetId" TEXT,
  "networkId" TEXT,
  "name" TEXT NOT NULL,
  "os" TEXT NOT NULL,
  "resources" TEXT NOT NULL,
  "hypervisor" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VirtualMachine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Service" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "protocol" TEXT NOT NULL,
  "port" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Asset_networkId_fkey'
  ) THEN
    ALTER TABLE "Asset"
      ADD CONSTRAINT "Asset_networkId_fkey"
      FOREIGN KEY ("networkId") REFERENCES "Network"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Network_userId_fkey'
  ) THEN
    ALTER TABLE "Network"
      ADD CONSTRAINT "Network_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'VirtualMachine_userId_fkey'
  ) THEN
    ALTER TABLE "VirtualMachine"
      ADD CONSTRAINT "VirtualMachine_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'VirtualMachine_assetId_fkey'
  ) THEN
    ALTER TABLE "VirtualMachine"
      ADD CONSTRAINT "VirtualMachine_assetId_fkey"
      FOREIGN KEY ("assetId") REFERENCES "Asset"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'VirtualMachine_networkId_fkey'
  ) THEN
    ALTER TABLE "VirtualMachine"
      ADD CONSTRAINT "VirtualMachine_networkId_fkey"
      FOREIGN KEY ("networkId") REFERENCES "Network"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Service_userId_fkey'
  ) THEN
    ALTER TABLE "Service"
      ADD CONSTRAINT "Service_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Service_assetId_fkey'
  ) THEN
    ALTER TABLE "Service"
      ADD CONSTRAINT "Service_assetId_fkey"
      FOREIGN KEY ("assetId") REFERENCES "Asset"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Asset_userId_type_idx" ON "Asset"("userId", "type");
CREATE INDEX IF NOT EXISTS "Asset_userId_networkId_idx" ON "Asset"("userId", "networkId");
CREATE INDEX IF NOT EXISTS "Network_userId_name_idx" ON "Network"("userId", "name");
CREATE INDEX IF NOT EXISTS "VirtualMachine_userId_hypervisor_idx" ON "VirtualMachine"("userId", "hypervisor");
CREATE INDEX IF NOT EXISTS "VirtualMachine_userId_networkId_idx" ON "VirtualMachine"("userId", "networkId");
CREATE INDEX IF NOT EXISTS "Service_userId_protocol_idx" ON "Service"("userId", "protocol");
CREATE INDEX IF NOT EXISTS "Service_assetId_port_idx" ON "Service"("assetId", "port");