/*
  Warnings:

  - You are about to drop the column `estimatedWaitTime` on the `queue_entries` table. All the data in the column will be lost.
  - You are about to drop the `queue_history` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "queue_history" DROP CONSTRAINT "queue_history_queueId_fkey";

-- DropIndex
DROP INDEX "queue_entries_expiresAt_idx";

-- AlterTable
ALTER TABLE "queue_entries" DROP COLUMN "estimatedWaitTime";

-- DropTable
DROP TABLE "queue_history";
