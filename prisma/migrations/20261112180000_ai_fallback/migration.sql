ALTER TYPE "AiProvider" ADD VALUE 'GROQ';

CREATE TABLE "AiFallbackEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "task" TEXT NOT NULL,
    "fromProvider" TEXT NOT NULL,
    "fromModel" TEXT NOT NULL,
    "toProvider" TEXT NOT NULL,
    "toModel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiFallbackEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiFallbackEvent_jobId_createdAt_idx" ON "AiFallbackEvent"("jobId", "createdAt");
CREATE INDEX "AiFallbackEvent_createdAt_idx" ON "AiFallbackEvent"("createdAt");
