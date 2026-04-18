import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { openrouter, getAIModel } from '@/lib/openrouter';
import { JdGeneratorSchema } from '@/lib/validations/jd-generator.schema';
import { createRateLimiter } from '@/lib/rate-limit';

const generateJdRateLimiter = createRateLimiter('generate-jd', 10, '1 m');

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

  // 4. Parse + Zod validate
  const body = await req.json().catch(() => null);
  const parsed = JdGeneratorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 5. Call OpenRouter
  const completion = await openrouter.chat.completions.create({
    model: getAIModel(),
    messages: [
      {
        role: 'system',
        content: `You are an expert technical recruiter. Write a complete, professional job description with exactly these sections in order:
1. About the Role
2. Responsibilities
3. Requirements
4. Nice to Have
5. What We Offer

Use the exact placeholder tokens (do not replace them): [SALARY RANGE], [YEARS OF EXPERIENCE], [LOCATION / REMOTE POLICY], [JOINING DATE].
Return only the job description text with no preamble or explanation.`,
      },
      {
        role: 'user',
        content: `Role: ${parsed.data.title}\nAbout this role: ${parsed.data.shortDesc}${parsed.data.vibe ? `\nCulture/vibe: ${parsed.data.vibe}` : ''}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.6,
  });

  // 6. Extract JD text
  const jd = completion.choices[0]?.message?.content?.trim() ?? '';

  // 7. Return
  return NextResponse.json({ data: { jd } }, { status: 200 });
}
