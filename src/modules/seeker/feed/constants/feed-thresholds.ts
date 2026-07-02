import { MatchThreshold } from '@/constants/enums';

/* Below this match %, show the credit warning before Apply (reuses MatchThreshold.GOOD = 60,
 * matching the feed API's LOW_MATCH_THRESHOLD so UI + missingSkillsHint stay consistent). */
export const LOW_MATCH_THRESHOLD = MatchThreshold.GOOD;

/* Jobs older than this many days are flagged "may be closed" (light-touch stale handling). */
export const STALE_JOB_DAYS = 30;
