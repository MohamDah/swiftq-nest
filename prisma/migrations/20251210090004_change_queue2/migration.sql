/*
  Warnings:

  - You are about to drop the column `requireCustomerName` on the `queues` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "queues" DROP COLUMN "requireCustomerName",
ADD COLUMN     "requireNames" BOOLEAN DEFAULT false;
