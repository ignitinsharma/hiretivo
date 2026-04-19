import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole, PlanTier } from '@/constants/enums';
import { openrouter, getAIModel } from '@/lib/openrouter';
import { JdGeneratorSchema } from '@/lib/validations/jd-generator.schema';
import { createRateLimiter } from '@/lib/rate-limit';
import { buildJdGeneratorMessages, JD_GENERATOR_CONFIG } from '@/lib/ai-prompts';
import { isAiTrialActive } from '@/lib/ai-trial';

const generateJdRateLimiter = createRateLimiter('generate-jd', 5, '1 m');

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
  const { success } = await generateJdRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 4. Plan gate — FREE plan cannot access AI features (bypass during trial)
  if (session.user.plan === PlanTier.FREE && !isAiTrialActive()) {
    return NextResponse.json(
      { error: 'AI job description generation requires a PRO or ENTERPRISE plan.' },
      { status: 403 },
    );
  }

  // 5. Parse + Zod validate
  const body = await req.json().catch(() => null);
  const parsed = JdGeneratorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 6. Call OpenRouter
  const { system, user } = buildJdGeneratorMessages(parsed.data);
  const completion = await openrouter.chat.completions.create({
    model: getAIModel(),
    ...JD_GENERATOR_CONFIG,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  // 6. Extract JD text
  const jd = completion.choices[0]?.message?.content?.trim() ?? '';

  // 7. Return
  return NextResponse.json({ data: { jd } }, { status: 200 });
}
