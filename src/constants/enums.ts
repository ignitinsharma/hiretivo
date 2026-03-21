/** App-wide enums — mirror `prisma/schema.prisma` (do not import enums from `@prisma/client` in UI code). */

export enum UserRole {
  SEEKER = "SEEKER",
  RECRUITER = "RECRUITER",
}

export enum JobStatus {
  DRAFT = "DRAFT",
  OPEN = "OPEN",
  PAUSED = "PAUSED",
  CLOSED = "CLOSED",
}

/** Same values as Prisma `AppStatus` (RULES.md uses `ApplicationStatus`). */
export enum ApplicationStatus {
  PENDING = "PENDING",
  REVIEWED = "REVIEWED",
  SHORTLISTED = "SHORTLISTED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}

export enum JobType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERNSHIP = "INTERNSHIP",
}

export enum ApplyType {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
}

export enum SkillLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

export enum WorkType {
  REMOTE = "REMOTE",
  HYBRID = "HYBRID",
  ONSITE = "ONSITE",
}

export enum PlanTier {
  FREE = "FREE",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export enum InterviewStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum MatchThreshold {
  STRONG = 80,
  GOOD = 60,
  PARTIAL = 40,
}
