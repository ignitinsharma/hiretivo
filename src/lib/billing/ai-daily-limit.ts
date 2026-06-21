import { AiFeature } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";

/* Free recruiters get this many uses per AI feature, per rolling day. */
export const FREE_AI_DAILY_LIMIT = 3;

/*
 * Safety ceiling for PAID recruiters per AI feature, per rolling day.
 * Far above any realistic human usage — exists only to bound LLM spend if an
 * account is scripted/compromised into looping requests. Not a product limit.
 */
export const PAID_AI_DAILY_CAP = 200;

/*
 * One Upstash sliding-window limiter per AI feature (3 uses / 1 day), keyed by recruiter userId.
 * Separate keys/instances from the per-minute abuse limiters so the two quotas never collide.
 */
const dailyLimiters: Record<AiFeature, ReturnType<typeof createRateLimiter>> = {
  [AiFeature.JD]: createRateLimiter("free-ai-jd-daily", FREE_AI_DAILY_LIMIT, "1 d"),
  [AiFeature.SKILLS]: createRateLimiter("free-ai-skills-daily", FREE_AI_DAILY_LIMIT, "1 d"),
  [AiFeature.SUMMARY]: createRateLimiter("free-ai-summary-daily", FREE_AI_DAILY_LIMIT, "1 d"),
  [AiFeature.SEARCH]: createRateLimiter("free-ai-search-daily", FREE_AI_DAILY_LIMIT, "1 d"),
};

/* Per-feature daily safety ceiling for paid recruiters, keyed by userId. */
const paidDailyCaps: Record<AiFeature, ReturnType<typeof createRateLimiter>> = {
  [AiFeature.JD]: createRateLimiter("paid-ai-jd-daily", PAID_AI_DAILY_CAP, "1 d"),
  [AiFeature.SKILLS]: createRateLimiter("paid-ai-skills-daily", PAID_AI_DAILY_CAP, "1 d"),
  [AiFeature.SUMMARY]: createRateLimiter("paid-ai-summary-daily", PAID_AI_DAILY_CAP, "1 d"),
  [AiFeature.SEARCH]: createRateLimiter("paid-ai-search-daily", PAID_AI_DAILY_CAP, "1 d"),
};

/*
 * consumeFreeDailyAiQuota
 * Consumes one daily credit for a FREE recruiter on the given AI feature.
 * Call ONLY when an actual AI generation is about to happen (e.g. after a cache miss),
 * since each call decrements the remaining daily allowance.
 * @returns true if the request is within the daily cap, false if the cap is exhausted.
 */
export async function consumeFreeDailyAiQuota(
  feature: AiFeature,
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
  feature: AiFeature,
  userId: string,
): Promise<boolean> {
  const { success } = await paidDailyCaps[feature].limit(userId);
  return success;
}
