/*
  Warnings:

  - You are about to drop the column `postalCodeId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `PostalCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PostalCode" DROP CONSTRAINT "PostalCode_cityId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_postalCodeId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "postalCodeId",
ADD COLUMN     "postalCode" TEXT;

-- DropTable
DROP TABLE "PostalCode";
