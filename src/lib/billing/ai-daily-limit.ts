import { AiFeature, PlanTier } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";

/* Free recruiters get this many uses per AI feature, per rolling day. */
export const FREE_AI_DAILY_LIMIT = 3;

/*
 * Safety ceiling for PAID recruiters per AI feature, per rolling day.
 * Far above any realistic human usage — exists only to bound LLM spend if an
 * account is scripted/compromised into looping requests. Not a product limit.
 */
export const PAID_AI_DAILY_CAP = 200;

/*
 * Recruiter/onboarding features on the free-plan DAILY quota. A narrowed
 * subset (not the full AiFeature enum) so seeker features added later
 * (RESUME_OPTIMIZE, COVER_LETTER — monthly credit, not daily quota) don't
 * force a bogus daily-limiter entry here.
 */
const RECRUITER_AI_FEATURES = [
  AiFeature.JD,
  AiFeature.SKILLS,
  AiFeature.SUMMARY,
  AiFeature.PARSE_RESUME,
] as const;
type RecruiterAiFeature = (typeof RECRUITER_AI_FEATURES)[number];

/*
 * One Upstash sliding-window limiter per AI feature (3 uses / 1 day), keyed by recruiter userId.
 * Separate keys/instances from the per-minute abuse limiters so the two quotas never collide.
 */
const dailyLimiters: Record<RecruiterAiFeature, ReturnType<typeof createRateLimiter>> = {
  [AiFeature.JD]: createRateLimiter("free-ai-jd-daily", FREE_AI_DAILY_LIMIT, "1 d"),
  [AiFeature.SKILLS]: createRateLimiter("free-ai-skills-daily", FREE_AI_DAILY_LIMIT, "1 d"),
  [AiFeature.SUMMARY]: createRateLimiter("free-ai-summary-daily", FREE_AI_DAILY_LIMIT, "1 d"),
  [AiFeature.PARSE_RESUME]: createRateLimiter("free-ai-parse-resume-daily", FREE_AI_DAILY_LIMIT, "1 d"),
};

/* Per-feature daily safety ceiling for paid recruiters, keyed by userId. */
const paidDailyCaps: Record<RecruiterAiFeature, ReturnType<typeof createRateLimiter>> = {
  [AiFeature.JD]: createRateLimiter("paid-ai-jd-daily", PAID_AI_DAILY_CAP, "1 d"),
  [AiFeature.SKILLS]: createRateLimiter("paid-ai-skills-daily", PAID_AI_DAILY_CAP, "1 d"),
  [AiFeature.SUMMARY]: createRateLimiter("paid-ai-summary-daily", PAID_AI_DAILY_CAP, "1 d"),
  [AiFeature.PARSE_RESUME]: createRateLimiter("paid-ai-parse-resume-daily", PAID_AI_DAILY_CAP, "1 d"),
};

/*
 * consumeFreeDailyAiQuota
 * Consumes one daily credit for a FREE recruiter on the given AI feature.
 * Call ONLY when an actual AI generation is about to happen (e.g. after a cache miss),
 * since each call decrements the remaining daily allowance.
 * @returns true if the request is within the daily cap, false if the cap is exhausted.
 */
export async function consumeFreeDailyAiQuota(
  feature: RecruiterAiFeature,
  userId: string,
): Promise<boolean> {
  const { success } = await dailyLimiters[feature].limit(userId);
  return success;
}

/*
 * consumePaidDailyAiCap
 * Consumes one credit against the paid-tier daily safety ceiling for a feature.
 * Bounds runaway/scripted LLM spend on paid accounts; legit usage never reaches it.
 * @returns true if within the daily cap, false if the ceiling is exhausted.
 */
export async function consumePaidDailyAiCap(
  feature: RecruiterAiFeature,
  userId: string,
): Promise<boolean> {
  const { success } = await paidDailyCaps[feature].limit(userId);
  return success;
}

// ---------------------------------------------------------------------------
// Seeker monthly AI credits (Phase 4 — apply-faster pivot)
// 1 credit = 1 job tailored (resume optimize + cover letter = ONE credit).
// Refund-on-failure: only decrement stays consumed once an artifact is saved.
// ---------------------------------------------------------------------------

/*
 * Seeker monthly credit allowances, keyed directly off the existing PlanTier
 * enum (DATA-MODEL §Phase 8 "Option A — recommended, low-risk": keep enum
 * values, remap meaning — STARTER="Pro" 400/mo, GROWTH="Max" 1000/mo, SCALE
 * hidden and capped at the Max allowance until Phase 8 remaps/hides it).
 * No separate SeekerPlan enum — would duplicate PlanTier for no behavioral
 * gain since session.user.plan is already a PlanTier today.
 */
export const MONTHLY_CREDITS: Record<PlanTier, number> = {
  [PlanTier.FREE]: 8,
  [PlanTier.STARTER]: 400,
  [PlanTier.GROWTH]: 1000,
  [PlanTier.SCALE]: 1000,
};

const SEEKER_CREDIT_WINDOW_SECONDS = 30 * 24 * 60 * 60; // 30 days

function seekerCreditKey(userId: string): string {
  return `hiretivo:seeker-monthly-credit:${userId}`;
}

/*
 * reserveSeekerCredit
 * Reserves ONE monthly credit for a seeker before generation runs. Uses an
 * atomic Redis INCR fixed-window counter (not @upstash/ratelimit's
 * sliding-window `resetUsedTokens`, which resets a caller's ENTIRE window
 * usage rather than one unit — that would over-refund any user who'd already
 * spent other credits this month). Sets a 30-day TTL on first use per window.
 * @param userId - seeker user id (limiter key)
 * @param plan   - seeker plan tier, selects the monthly allowance
 * @returns { allowed: boolean; remaining: number } — allowed=false means quota exhausted
 * @sideeffect increments the fixed-window counter; pair with refundSeekerCredit on failure
 */
export async function reserveSeekerCredit(
  userId: string,
  plan: PlanTier,
): Promise<{ allowed: boolean; remaining: number }> {
  const key = seekerCreditKey(userId);
  const allowance = MONTHLY_CREDITS[plan];
  const used = await redis.incr(key);
  if (used === 1) {
    await redis.expire(key, SEEKER_CREDIT_WINDOW_SECONDS);
  }
  if (used > allowance) {
    await redis.decr(key); // release the over-limit reservation, don't leak count
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: allowance - used };
}

/*
 * refundSeekerCredit
 * Returns the single credit reserved by reserveSeekerCredit when generation
 * fails BEFORE an artifact is saved. Atomic DECR — never refunds more than
 * the one credit this request reserved, and floors at zero against
 * double-refund races.
 * @param userId - seeker user id (same key used to reserve)
 * @sideeffect decrements the fixed-window counter by exactly one, floored at 0
 */
export async function refundSeekerCredit(userId: string): Promise<void> {
  const key = seekerCreditKey(userId);
  const remaining = await redis.decr(key);
  if (remaining < 0) {
    await redis.incr(key); // guard: never go negative (e.g. a duplicate refund call)
  }
}

/*
 * getSeekerCreditStatus
 * Reads remaining monthly credits without consuming one (for UI display).
 * @returns { remaining: number; limit: number }
 */
export async function getSeekerCreditStatus(
  userId: string,
  plan: PlanTier,
): Promise<{ remaining: number; limit: number }> {
  const key = seekerCreditKey(userId);
  const used = Number((await redis.get<number>(key)) ?? 0);
  const limit = MONTHLY_CREDITS[plan];
  return { remaining: Math.max(0, limit - used), limit };
}

/*
 * One wizard run (resume optimize + cover letter) spends exactly ONE credit.
 * A client-supplied `reuseReservation: boolean` cannot be trusted to prove
 * that — a caller could always send true and get free cover letters, or
 * reserve twice by sending false. optimize-resume mints a short-TTL,
 * single-use handle on successful reservation; cover-letter must present
 * and atomically consume it (GETDEL) to skip its own reservation.
 */
const APPLY_RESERVATION_TTL_SECONDS = 10 * 60; // bounds the reuse window to one wizard run

function applyReservationKey(userId: string, handle: string): string {
  return `hiretivo:apply-reservation:${userId}:${handle}`;
}

/*
 * mintApplyReservationHandle
 * Issues a single-use handle proving optimize-resume already reserved this
 * wizard run's credit, so cover-letter can skip reserving a second one.
 * @param userId - seeker user id that owns the reservation
 * @returns opaque handle string, valid for APPLY_RESERVATION_TTL_SECONDS
 */
export async function mintApplyReservationHandle(userId: string): Promise<string> {
  const handle = crypto.randomUUID();
  await redis.set(applyReservationKey(userId, handle), "1", { ex: APPLY_RESERVATION_TTL_SECONDS });
  return handle;
}

/*
 * consumeApplyReservationHandle
 * Atomically checks and deletes a reservation handle (GETDEL) — a handle can
 * be redeemed exactly once. Returns false for a missing/expired/already-used
 * handle, or one minted for a different user, in which case the caller must
 * fall back to reserving its own credit.
 * @param userId - seeker user id attempting to reuse the reservation
 * @param handle - handle returned by mintApplyReservationHandle
 * @returns true if the handle was valid and has now been consumed
 */
export async function consumeApplyReservationHandle(userId: string, handle: string): Promise<boolean> {
  if (!handle) return false;
  const value = await redis.getdel(applyReservationKey(userId, handle));
  return value !== null;
}
