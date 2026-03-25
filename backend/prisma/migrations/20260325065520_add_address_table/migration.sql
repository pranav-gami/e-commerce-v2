-- CreateTable
CREATE TABLE "Address" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "label" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "countryId" INTEGER NOT NULL,
    "stateId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 1: Add Order columns as nullable
ALTER TABLE "Order" ADD COLUMN "addressId"      INTEGER;
ALTER TABLE "Order" ADD COLUMN "snapFullName"   TEXT;
ALTER TABLE "Order" ADD COLUMN "snapPhone"      TEXT;
ALTER TABLE "Order" ADD COLUMN "snapAddress"    TEXT;
ALTER TABLE "Order" ADD COLUMN "snapPostalCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "snapCity"       TEXT;
ALTER TABLE "Order" ADD COLUMN "snapState"      TEXT;
ALTER TABLE "Order" ADD COLUMN "snapCountry"    TEXT;

-- Step 2: Fill existing rows with placeholder values
UPDATE "Order" SET
  "snapFullName"   = 'Legacy Order',
  "snapPhone"      = 'N/A',
  "snapAddress"    = 'N/A',
  "snapPostalCode" = 'N/A',
  "snapCity"       = 'N/A',
  "snapState"      = 'N/A',
  "snapCountry"    = 'N/A'
WHERE "snapFullName" IS NULL;

-- Step 3: Make snap columns NOT NULL (addressId stays nullable for legacy orders)
ALTER TABLE "Order" ALTER COLUMN "snapFullName"   SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "snapPhone"      SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "snapAddress"    SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "snapPostalCode" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "snapCity"       SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "snapState"      SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "snapCountry"    SET NOT NULL;

-- Step 4: Add FK for addressId (nullable, so legacy orders are fine)
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;