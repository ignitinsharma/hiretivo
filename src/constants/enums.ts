/** App-wide enums — mirror `prisma/schema.prisma` (do not import enums from `@prisma/client` in UI code). */

export enum UserRole {
  SEEKER = "SEEKER",
}

export const USER_ROLE_VALUES = [UserRole.SEEKER] as const;

export enum OAuthIntentSource {
  SEEKER_LOGIN = "seeker-login",
  SEEKER_REGISTER = "seeker-register",
}

export const OAUTH_INTENT_SOURCE_VALUES = [
  OAuthIntentSource.SEEKER_LOGIN,
  OAuthIntentSource.SEEKER_REGISTER,
] as const;

export enum AuthErrorCode {
  WRONG_ROLE_OAUTH = "wrong_role_oauth",
  OAUTH_ACCOUNT_NOT_LINKED = "oauth_account_not_linked",
  OAUTH_SIGNIN_FAILED = "oauth_signin_failed",
}

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

export enum AutomationStatus {
  GENERATING = "GENERATING",
  READY = "READY",
  APPLYING = "APPLYING",
  SUBMITTED = "SUBMITTED",
  NEEDS_YOU = "NEEDS_YOU",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED",
  SKIPPED = "SKIPPED",
}

export const AUTOMATION_STATUS_VALUES = [
  AutomationStatus.GENERATING,
  AutomationStatus.READY,
  AutomationStatus.APPLYING,
  AutomationStatus.SUBMITTED,
  AutomationStatus.NEEDS_YOU,
  AutomationStatus.FAILED,
  AutomationStatus.COMPLETED,
  AutomationStatus.SKIPPED,
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

export enum LocationClass {
  WORLDWIDE = 'worldwide',
  US_ONLY = 'us-only',
  EMEA = 'emea',
  INDIA = 'india',
  ONSITE = 'onsite',
}

export const LOCATION_CLASS_VALUES = [
  LocationClass.WORLDWIDE,
  LocationClass.US_ONLY,
  LocationClass.EMEA,
  LocationClass.INDIA,
  LocationClass.ONSITE,
] as const;

export enum PlanTier {
  FREE = "FREE",
  PRO = "PRO",
  UNLIMITED = "UNLIMITED",
}

export const PLAN_TIER_VALUES = [
  PlanTier.FREE,
  PlanTier.PRO,
  PlanTier.UNLIMITED,
] as const;

export enum PipelineStage {
  NOT_APPLIED = "NOT_APPLIED",
  APPLIED = "APPLIED",
  INTERVIEWING = "INTERVIEWING",
  OFFER = "OFFER",
  REJECTED = "REJECTED",
}

export const PIPELINE_STAGE_VALUES = [
  PipelineStage.NOT_APPLIED,
  PipelineStage.APPLIED,
  PipelineStage.INTERVIEWING,
  PipelineStage.OFFER,
  PipelineStage.REJECTED,
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
  PRO = "pro",
  UNLIMITED = "unlimited",
}

export enum AiMessageRole {
  SYSTEM = "system",
  USER = "user",
}

/* Deterministic candidate verdict derived from fit level — drives the AI summary verdict line. */
export enum VerdictLabel {
  STRONG_FIT = "Strong fit",
  WORTH_SCREENING = "Worth screening",
  STRETCH_HIRE = "Stretch hire",
}

/* AI features subject to the free-plan daily usage quota. */
export enum AiFeature {
  JD = "jd",
  SKILLS = "skills",
  SUMMARY = "summary",
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

export enum VerificationStatus {
  NOT_SUBMITTED = "NOT_SUBMITTED",
  PENDING = "PENDING",
  IN_REVIEW = "IN_REVIEW",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export const POSITION_TYPE_VALUES = [
  PositionType.TECHNICAL,
  PositionType.NON_TECHNICAL,
] as const;

/** Visual style for the shared ProfileLinks icon row. */
export enum ProfileLinkVariant {
  GHOST = "ghost",
  BORDERED = "bordered",
}

export enum CompanyIndustry {
  TECHNOLOGY = "TECHNOLOGY",
  FINANCE = "FINANCE",
  HEALTHCARE = "HEALTHCARE",
  EDUCATION = "EDUCATION",
  OTHER = "OTHER",
}

export enum FundingStage {
  BOOTSTRAPPED = "BOOTSTRAPPED",
  PRE_SEED = "PRE_SEED",
  SEED = "SEED",
  SERIES_A = "SERIES_A",
  SERIES_B = "SERIES_B",
  SERIES_C = "SERIES_C",
  SERIES_C_PLUS = "SERIES_C_PLUS",
  PUBLICLY_TRADED = "PUBLICLY_TRADED",
}

export enum SeekerSituation {
  ACTIVELY_LOOKING = "ACTIVELY_LOOKING",
  OPEN_TO_OFFERS = "OPEN_TO_OFFERS",
  EXPLORING_OPTIONS = "EXPLORING_OPTIONS",
  STUDENT_FRESH_GRAD = "STUDENT_FRESH_GRAD",
}

export enum SeekerAvailability {
  IMMEDIATELY = "IMMEDIATELY",
  TWO_WEEKS = "TWO_WEEKS",
  ONE_MONTH_PLUS = "ONE_MONTH_PLUS",
}

/**
 * Resolved state of the DB-backed user sitting behind a (valid) JWT session.
 * Drives AuthGuard routing — MISSING must be handled distinctly from
 * NOT_ONBOARDED to avoid the JWT-vs-DB redirect loop (stale cookie, deleted
 * user, data reset). A missing user is an invalid session, not an unboarded one.
 */
export enum SessionUserState {
  MISSING = "MISSING",
  NOT_ONBOARDED = "NOT_ONBOARDED",
  OK = "OK",
}

export enum AtsSource {
  ASHBY = 'ashby',
  GREENHOUSE = 'greenhouse',
  LEVER = 'lever',
}
