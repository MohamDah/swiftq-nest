-- DropIndex
DROP INDEX "queue_entries_queueId_status_idx";

-- AlterTable
ALTER TABLE "queues" ALTER COLUMN "averageServiceTime" SET DEFAULT 5,
ALTER COLUMN "averageServiceTime" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "queue_entries_queueId_status_joinedAt_idx" ON "queue_entries"("queueId", "status", "joinedAt");
