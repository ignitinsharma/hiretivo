CREATE TYPE "AIProvider" AS ENUM ('OPENROUTER', 'OPENAI', 'ANTHROPIC', 'GOOGLE', 'LOCAL');

CREATE TABLE "AISettings" (
    "userId" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "encryptedApiKey" TEXT,
    "endpoint" TEXT,
    "supportsFile" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AISettings_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "AISettings" ADD CONSTRAINT "AISettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
