/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `queue_entries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "queue_entries" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "queues" ADD COLUMN     "deletedAt" TIMESTAMP(3);
