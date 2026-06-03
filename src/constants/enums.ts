/** App-wide enums — mirror `prisma/schema.prisma` (do not import enums from `@prisma/client` in UI code). */

export enum UserRole {
  SEEKER = "SEEKER",
  RECRUITER = "RECRUITER",
}

export const USER_ROLE_VALUES = [UserRole.SEEKER, UserRole.RECRUITER] as const;

export enum JobStatus {
  DRAFT = "DRAFT",
  OPEN = "OPEN",
  PAUSED = "PAUSED",
  CLOSED = "CLOSED",
  UNPUBLISHED = "UNPUBLISHED",
  DELETED = "DELETED",
}

export const JOB_STATUS_VALUES = [
  JobStatus.DRAFT,
  JobStatus.OPEN,
  JobStatus.PAUSED,
  JobStatus.CLOSED,
] as const;

/** Same values as Prisma `AppStatus` (RULES.md uses `ApplicationStatus`). */
export enum ApplicationStatus {
  APPLIED = "APPLIED",
  REVIEWING = "REVIEWING",
  INTERVIEW = "INTERVIEW",
  OFFER = "OFFER",
  HIRED = "HIRED",
  REJECTED = "REJECTED",
}

export const APPLICATION_STATUS_VALUES = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
] as const;

export enum JobType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERNSHIP = "INTERNSHIP",
}

export enum OnboardingJobType {
  FULL_TIME = "FULL_TIME",
  CONTRACT = "CONTRACT",
  PART_TIME = "PART_TIME",
  FREELANCE = "FREELANCE",
  BOTH = "BOTH",
}

export const RECRUITER_ONBOARDING_JOB_TYPE_VALUES = [
  OnboardingJobType.FULL_TIME,
  OnboardingJobType.CONTRACT,
  OnboardingJobType.PART_TIME,
  OnboardingJobType.FREELANCE,
] as const;

export const SEEKER_ONBOARDING_JOB_TYPE_VALUES = [
  OnboardingJobType.FULL_TIME,
  OnboardingJobType.CONTRACT,
  OnboardingJobType.BOTH,
] as const;

export const JOB_TYPE_VALUES = [
  JobType.FULL_TIME,
  JobType.PART_TIME,
  JobType.CONTRACT,
  JobType.INTERNSHIP,
] as const;

export enum ApplyType {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
}

export const APPLY_TYPE_VALUES = [ApplyType.INTERNAL, ApplyType.EXTERNAL] as const;

export enum SkillLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

export const SKILL_LEVEL_VALUES = [
  SkillLevel.BEGINNER,
  SkillLevel.INTERMEDIATE,
  SkillLevel.ADVANCED,
  SkillLevel.EXPERT,
] as const;

export enum WorkType {
  REMOTE = "REMOTE",
  HYBRID = "HYBRID",
  ONSITE = "ONSITE",
}

export const WORK_TYPE_VALUES = [WorkType.REMOTE, WorkType.HYBRID, WorkType.ONSITE] as const;

export enum PlanTier {
  FREE = "FREE",
  STARTER = "STARTER",
  GROWTH = "GROWTH",
  SCALE = "SCALE",
}

export const PLAN_TIER_VALUES = [
  PlanTier.FREE,
  PlanTier.STARTER,
  PlanTier.GROWTH,
  PlanTier.SCALE,
] as const;

export enum InterviewStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export const INTERVIEW_STATUS_VALUES = [
  InterviewStatus.SCHEDULED,
  InterviewStatus.COMPLETED,
  InterviewStatus.CANCELLED,
  InterviewStatus.NO_SHOW,
] as const;

export enum MatchThreshold {
  STRONG = 80,
  GOOD = 60,
  PARTIAL = 40,
}

export enum CurrencyCode {
  USD = "USD",
  INR = "INR",
  EUR = "EUR",
  GBP = "GBP",
}

export const CURRENCY_CODE_VALUES = [
  CurrencyCode.USD,
  CurrencyCode.INR,
  CurrencyCode.EUR,
  CurrencyCode.GBP,
] as const;

export const SEEKER_CURRENCY_VALUES = [
  CurrencyCode.USD,
  CurrencyCode.EUR,
  CurrencyCode.GBP,
] as const;

export const BILLING_CURRENCY_VALUES = [CurrencyCode.USD, CurrencyCode.INR] as const;

export enum BillingPeriod {
  MONTHLY = "monthly",
  ANNUAL = "annual",
}

export const BILLING_PERIOD_VALUES = [BillingPeriod.MONTHLY, BillingPeriod.ANNUAL] as const;

export enum PricingTierId {
  FREE = "free",
  STARTER = "starter",
  GROWTH = "growth",
  SCALE = "scale",
}

export enum AiMessageRole {
  SYSTEM = "system",
  USER = "user",
}

export enum ContactRequestType {
  CONTACT = "CONTACT",
  BOOK_CALL = "BOOK_CALL",
  REPORT_BUG = "REPORT_BUG",
}

export const CONTACT_REQUEST_TYPE_VALUES = [
  ContactRequestType.CONTACT,
  ContactRequestType.BOOK_CALL,
  ContactRequestType.REPORT_BUG,
] as const;

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  CANCELED = "CANCELED",
}

export enum PositionType {
  TECHNICAL = "technical",
  NON_TECHNICAL = "non-technical",
}

export const POSITION_TYPE_VALUES = [
  PositionType.TECHNICAL,
  PositionType.NON_TECHNICAL,
] as const;
