CREATE TYPE "CalendarEventKind" AS ENUM ('INTERVIEW', 'DEADLINE');

CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" "CalendarEventKind" NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalendarEvent_applicationId_idx" ON "CalendarEvent"("applicationId");
CREATE INDEX "CalendarEvent_startsAt_idx" ON "CalendarEvent"("startsAt");
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
