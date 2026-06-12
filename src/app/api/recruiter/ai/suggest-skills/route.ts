import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AiMessageRole, UserRole, PlanTier, AiFeature } from '@/constants/enums';
import { openrouter, getAIModel } from '@/lib/openrouter';
import { SkillSuggestSchema, SkillSuggestOutputSchema } from '@/lib/validations/skill-suggest.schema';
import { createRateLimiter } from '@/lib/rate-limit';
import { buildSkillSuggestMessages, SKILL_SUGGEST_CONFIG } from '@/lib/ai-prompts';
import { isAdminSession } from '@/lib/admin/is-admin';
import { consumeFreeDailyAiQuota, consumePaidDailyAiCap } from '@/lib/billing/ai-daily-limit';

const suggestSkillsRateLimiter = createRateLimiter('suggest-skills', 10, '1 m');

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = isAdminSession(session);

  // 2. Role check — admin bypasses recruiter-only gate
  if (!admin && session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Rate limit
  const { success } = await suggestSkillsRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 4. Plan gate — FREE plan gets 3 skill suggestions/day; paid plans get a high
  // daily safety ceiling (anti-abuse). Admin bypasses both.
  if (!admin && session.user.plan === PlanTier.FREE) {
    const allowed = await consumeFreeDailyAiQuota(AiFeature.SKILLS, session.user.id);
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "You've used your 3 free AI skill suggestions today. Upgrade to a paid plan for unlimited suggestions.",
        },
        { status: 403 },
      );
    }
  } else if (!admin) {
    const withinCap = await consumePaidDailyAiCap(AiFeature.SKILLS, session.user.id);
    if (!withinCap) {
      return NextResponse.json(
        { error: "Daily AI usage limit reached. Please try again tomorrow." },
        { status: 429 },
      );
    }
  }

  // 5. Parse + Zod validate
  const body = await req.json().catch(() => null);
  const parsed = SkillSuggestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 6. Call OpenRouter
  const { system, user } = buildSkillSuggestMessages(parsed.data);
  const completion = await openrouter.chat.completions.create({
    model: getAIModel(),
    ...SKILL_SUGGEST_CONFIG,
    response_format: { type: 'json_object' },
    messages: [
      { role: AiMessageRole.SYSTEM, content: system },
      { role: AiMessageRole.USER, content: user },
    ],
  });

  // 7. Parse response — tiered {core, secondary} object; tolerate malformed/legacy shapes (T-13-11)
  const toStringList = (value: unknown, cap: number): string[] =>
    Array.isArray(value)
      ? value.filter((s): s is string => typeof s === 'string').slice(0, cap)
      : [];

  let skills: { core: string[]; secondary: string[] } = { core: [], secondary: [] };
  try {
    const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned) as unknown;

    const tiered = SkillSuggestOutputSchema.safeParse(parsed);
    if (tiered.success) {
      skills = {
        core: tiered.data.core.slice(0, 6),
        secondary: tiered.data.secondary.slice(0, 6),
      };
    } else if (Array.isArray(parsed)) {
      // Degraded fallback — legacy bare array → treat all as core
      skills = { core: toStringList(parsed, 6), secondary: [] };
    }
  } catch {
    skills = { core: [], secondary: [] }; // safe fallback — never 500
  }

  // 8. Return
  return NextResponse.json({ data: { skills } }, { status: 200 });
}
