/*
  Warnings:

  - A unique constraint covering the columns `[entryId]` on the table `push_subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_entryId_key" ON "push_subscriptions"("entryId");
