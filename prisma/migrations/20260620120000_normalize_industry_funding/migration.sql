-- Normalize RecruiterProfile.industry from old display strings to new enum keys.
-- Old values: "SaaS", "Fintech", "EdTech", "Marketplace", "Agency", "E-commerce"
-- New values: "TECHNOLOGY", "FINANCE", "HEALTHCARE", "EDUCATION", "OTHER"
UPDATE "RecruiterProfile"
SET industry = CASE industry
  WHEN 'SaaS'        THEN 'TECHNOLOGY'
  WHEN 'EdTech'      THEN 'TECHNOLOGY'
  WHEN 'Fintech'     THEN 'FINANCE'
  WHEN 'Healthcare'  THEN 'HEALTHCARE'
  WHEN 'Education'   THEN 'EDUCATION'
  WHEN 'Agency'      THEN 'OTHER'
  WHEN 'Marketplace' THEN 'OTHER'
  WHEN 'E-commerce'  THEN 'OTHER'
  ELSE industry
END
WHERE industry IS NOT NULL
  AND industry NOT IN ('TECHNOLOGY', 'FINANCE', 'HEALTHCARE', 'EDUCATION', 'OTHER');

-- Normalize RecruiterProfile.fundingType from human-readable labels to enum keys.
-- Handles the case where fundingType was stored as display labels rather than keys.
UPDATE "RecruiterProfile"
SET "fundingType" = CASE "fundingType"
  WHEN 'Bootstrapped'    THEN 'BOOTSTRAPPED'
  WHEN 'Pre-seed'        THEN 'PRE_SEED'
  WHEN 'Pre Seed'        THEN 'PRE_SEED'
  WHEN 'Seed'            THEN 'SEED'
  WHEN 'Series A'        THEN 'SERIES_A'
  WHEN 'Series B'        THEN 'SERIES_B'
  WHEN 'Series C'        THEN 'SERIES_C'
  WHEN 'Series C+'       THEN 'SERIES_C_PLUS'
  WHEN 'Publicly Traded' THEN 'PUBLICLY_TRADED'
  ELSE "fundingType"
END
WHERE "fundingType" IS NOT NULL
  AND "fundingType" NOT IN ('BOOTSTRAPPED', 'PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'SERIES_C_PLUS', 'PUBLICLY_TRADED');
