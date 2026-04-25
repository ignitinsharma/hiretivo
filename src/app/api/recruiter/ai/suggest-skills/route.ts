import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AiMessageRole, UserRole, PlanTier } from '@/constants/enums';
import { openrouter, getAIModel } from '@/lib/openrouter';
import { SkillSuggestSchema } from '@/lib/validations/skill-suggest.schema';
import { createRateLimiter } from '@/lib/rate-limit';
import { buildSkillSuggestMessages, SKILL_SUGGEST_CONFIG } from '@/lib/ai-prompts';
import { isAiTrialActive } from '@/lib/ai-trial';

const suggestSkillsRateLimiter = createRateLimiter('suggest-skills', 10, '1 m');

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Role check
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Rate limit
  const { success } = await suggestSkillsRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 4. Plan gate — FREE plan cannot access AI features (bypass during trial)
  if (session.user.plan === PlanTier.FREE && !isAiTrialActive()) {
    return NextResponse.json(
      { error: 'AI skill suggestions require a PRO or ENTERPRISE plan.' },
      { status: 403 },
    );
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
    messages: [
      { role: AiMessageRole.SYSTEM, content: system },
      { role: AiMessageRole.USER, content: user },
    ],
  });

  // 7. Parse response — handle malformed JSON from model (T-13-11)
  let skills: string[] = [];
  try {
    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
    const parsedSkills = JSON.parse(cleaned) as unknown;
    if (Array.isArray(parsedSkills)) {
      skills = parsedSkills.filter((s): s is string => typeof s === 'string').slice(0, 10);
    }
  } catch {
    skills = []; // safe fallback — return empty array, never 500
  }

  // 8. Return
  return NextResponse.json({ data: { skills } }, { status: 200 });
}
