/*
  Warnings:

  - Made the column `displayNumber` on table `queue_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "queue_entries" ALTER COLUMN "displayNumber" SET NOT NULL;
