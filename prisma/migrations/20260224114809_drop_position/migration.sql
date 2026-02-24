/*
  Warnings:

  - You are about to drop the column `position` on the `queue_entries` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "queue_entries_queueId_status_position_idx";

-- AlterTable
ALTER TABLE "queue_entries" DROP COLUMN "position";

-- CreateIndex
CREATE INDEX "queue_entries_queueId_status_idx" ON "queue_entries"("queueId", "status");
