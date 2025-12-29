-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_fcmToken_key" ON "push_subscriptions"("fcmToken");

-- CreateIndex
CREATE INDEX "push_subscriptions_entryId_idx" ON "push_subscriptions"("entryId");

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "queue_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
