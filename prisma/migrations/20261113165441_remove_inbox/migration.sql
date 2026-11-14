/*
  Warnings:

  - You are about to drop the column `historyId` on the `GoogleAccount` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncAt` on the `GoogleAccount` table. All the data in the column will be lost.
  - You are about to drop the column `syncProblem` on the `GoogleAccount` table. All the data in the column will be lost.
  - You are about to drop the `EmailMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailMessage" DROP CONSTRAINT "EmailMessage_applicationId_fkey";

-- AlterTable
ALTER TABLE "GoogleAccount" DROP COLUMN "historyId",
DROP COLUMN "lastSyncAt",
DROP COLUMN "syncProblem";

-- DropTable
DROP TABLE "EmailMessage";

-- DropEnum
DROP TYPE "EmailDirection";

-- DropEnum
DROP TYPE "ReplyKind";
