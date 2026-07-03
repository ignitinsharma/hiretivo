-- CreateEnum
CREATE TYPE "OptimizeMode" AS ENUM ('HONEST', 'AGGRESSIVE');

-- AlterTable
ALTER TABLE "ApplicationDefaults" ADD COLUMN     "optimizeMode" "OptimizeMode" NOT NULL DEFAULT 'HONEST';
