import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole, PlanTier } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { openrouter, getAIModel } from '@/lib/openrouter';
import { AiSummaryParamsSchema } from '@/lib/validations/ai-summary.schema';
import { createRateLimiter } from '@/lib/rate-limit';

const aiSummaryRateLimiter = createRateLimiter('ai-summary', 20, '1 m');

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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
  const { success } = await aiSummaryRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 4. Plan gate (D-07): FREE plan cannot access AI summaries
  if (session.user.plan === PlanTier.FREE) {
    return NextResponse.json(
      { error: 'AI candidate summaries require a PRO or ENTERPRISE plan.' },
      { status: 403 },
    );
  }

  // 5. Param validation
  const { id } = await params;
  const parsed = AiSummaryParamsSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 6. Ownership check — return 404 to avoid leaking record existence (T-13-02)
  const application = await prisma.application.findUnique({
    where: { id: parsed.data.id },
    select: {
      aiSummary: true,
      matchScore: true,
      job: {
        select: { recruiterId: true },
      },
      seeker: {
        select: {
          seekerProfile: {
            select: {
              headline: true,
              skills: {
                include: {
                  skill: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!application || application.job.recruiterId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 7. Cache hit — return without calling OpenRouter
  if (application.aiSummary !== null) {
    return NextResponse.json({ data: { summary: application.aiSummary } }, { status: 200 });
  }

  // 8. Build prompt inputs
  const skills = (application.seeker.seekerProfile?.skills ?? []).map((s) => s.skill.name);
  const matchScore = application.matchScore;
  // T-13-03: truncate headline to 200 chars and strip HTML to prevent prompt injection
  const rawHeadline = application.seeker.seekerProfile?.headline ?? null;
  const headline = rawHeadline
    ? rawHeadline.replace(/<[^>]*>/g, '').slice(0, 200)
    : null;

  // 9. Generate summary via OpenRouter
  const completion = await openrouter.chat.completions.create({
    model: getAIModel(),
    max_tokens: 80,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'You are a recruitment assistant. Write exactly one sentence (under 20 words) summarising this candidate\'s fit for the role based on their skills and match score. Do not use the candidate\'s name.',
      },
      {
        role: 'user',
        content: `Skills: ${skills.join(', ')}. Match score: ${matchScore}%. Headline: ${headline ?? 'Not provided'}.`,
      },
    ],
  });

  const summary = completion.choices[0]?.message?.content?.trim() ?? 'No summary available.';

  // 10. Write-back (D-04): cache on Application — continue even if write fails
  try {
    await prisma.application.update({
      where: { id: parsed.data.id },
      data: { aiSummary: summary },
    });
  } catch (err) {
    console.error('[ai-summary] write-back failed:', err);
  }

  // 11. Return summary
  return NextResponse.json({ data: { summary } }, { status: 200 });
}
