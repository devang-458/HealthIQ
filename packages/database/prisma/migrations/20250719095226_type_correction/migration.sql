/*
  Warnings:

  - You are about to drop the column `bloidPressureDiastolic` on the `HealthRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HealthRecord" DROP COLUMN "bloidPressureDiastolic",
ADD COLUMN     "bloodPressureDiastolic" INTEGER;
