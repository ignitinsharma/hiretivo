ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User" AS u
SET "onboardingCompleted" = true
WHERE u.role = 'SEEKER'
  AND EXISTS (
    SELECT 1
    FROM "SeekerProfile" AS sp
    WHERE sp."userId" = u.id
      AND sp."situation" IS NOT NULL
      AND sp."primaryRole" IS NOT NULL
      AND sp."availability" IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM "SeekerSkill" AS ss
        WHERE ss."seekerProfileId" = sp.id
      )
  );

UPDATE "User" AS u
SET "onboardingCompleted" = true
WHERE u.role = 'RECRUITER'
  AND EXISTS (
    SELECT 1
    FROM "RecruiterProfile" AS rp
    WHERE rp."userId" = u.id
  );
