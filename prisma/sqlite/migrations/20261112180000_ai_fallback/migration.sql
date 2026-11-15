CREATE TABLE "AiFallbackEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT,
    "task" TEXT NOT NULL,
    "fromProvider" TEXT NOT NULL,
    "fromModel" TEXT NOT NULL,
    "toProvider" TEXT NOT NULL,
    "toModel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AiFallbackEvent_jobId_createdAt_idx" ON "AiFallbackEvent"("jobId", "createdAt");
CREATE INDEX "AiFallbackEvent_createdAt_idx" ON "AiFallbackEvent"("createdAt");
