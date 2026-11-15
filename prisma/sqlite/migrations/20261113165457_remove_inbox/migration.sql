/*
  Warnings:

  - You are about to drop the `EmailMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `historyId` on the `GoogleAccount` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncAt` on the `GoogleAccount` table. All the data in the column will be lost.
  - You are about to drop the column `syncProblem` on the `GoogleAccount` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "EmailMessage_sentAt_idx";

-- DropIndex
DROP INDEX "EmailMessage_applicationId_sentAt_idx";

-- DropIndex
DROP INDEX "EmailMessage_threadId_idx";

-- DropIndex
DROP INDEX "EmailMessage_gmailId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EmailMessage";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GoogleAccount" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'google',
    "email" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT '',
    "authMode" TEXT NOT NULL DEFAULT 'own',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GoogleAccount" ("authMode", "createdAt", "email", "id", "refreshTokenEnc", "scopes", "updatedAt") SELECT "authMode", "createdAt", "email", "id", "refreshTokenEnc", "scopes", "updatedAt" FROM "GoogleAccount";
DROP TABLE "GoogleAccount";
ALTER TABLE "new_GoogleAccount" RENAME TO "GoogleAccount";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
