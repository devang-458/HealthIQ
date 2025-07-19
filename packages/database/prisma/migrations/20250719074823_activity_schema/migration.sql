/*
  Warnings:

  - You are about to drop the column `duraion` on the `Activity` table. All the data in the column will be lost.
  - Added the required column `duration` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "duraion",
ADD COLUMN     "duration" INTEGER NOT NULL;
