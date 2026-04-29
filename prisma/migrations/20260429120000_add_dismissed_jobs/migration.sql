CREATE TABLE "DismissedJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DismissedJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DismissedJob_userId_jobId_key" ON "DismissedJob"("userId", "jobId");
CREATE INDEX "DismissedJob_userId_idx" ON "DismissedJob"("userId");
CREATE INDEX "DismissedJob_jobId_idx" ON "DismissedJob"("jobId");

ALTER TABLE "DismissedJob" ADD CONSTRAINT "DismissedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DismissedJob" ADD CONSTRAINT "DismissedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
